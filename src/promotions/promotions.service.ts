import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreviewPromotionDto, CommitPromotionDto } from './dto/promotion.dto';

const GRADE_ORDER = [
  'Nursery',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const DEFAULT_PASS_THRESHOLD = 40;

function nextGradeOf(grade: string): string | null {
  const idx = GRADE_ORDER.indexOf(grade);
  if (idx === -1 || idx === GRADE_ORDER.length - 1) return null;
  return GRADE_ORDER[idx + 1];
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private evaluatePassStatus(
    reportCard: { computedData: unknown; gpa: string } | undefined,
    threshold: number,
  ): { passed: boolean; percentage: number | null } {
    if (!reportCard) return { passed: true, percentage: null }; // no record — default to promote, admin can override

    const computed = reportCard.computedData as any;
    let percentage: number | null = null;
    if (computed?.percentage != null) {
      percentage = parseFloat(computed.percentage);
    } else if (reportCard.gpa) {
      percentage = parseFloat(reportCard.gpa) * 10;
    }
    if (percentage == null || isNaN(percentage))
      return { passed: true, percentage: null };
    return { passed: percentage >= threshold, percentage };
  }

  /**
   * Batched replacement for calling a per-enrollment `findFirst` in a loop —
   * that pattern is a real N+1 (one query per student), fine for a single
   * class but a multi-second-to-minutes hang at whole-session scale (9,000+
   * students in the seeded dataset). One query for every candidate
   * enrollment, then the same "latest report card, same threshold logic" as
   * before — same semantics, not a behavior change.
   */
  private async batchPassStatuses(
    enrollmentIds: string[],
    sessionId: string,
    threshold: number,
  ): Promise<Map<string, { passed: boolean; percentage: number | null }>> {
    const reportCards = await this.prisma.reportCard.findMany({
      where: { enrollmentId: { in: enrollmentIds }, exam: { sessionId } },
      orderBy: { createdAt: 'desc' },
    });

    const latestByEnrollment = new Map<string, (typeof reportCards)[number]>();
    for (const rc of reportCards) {
      if (!latestByEnrollment.has(rc.enrollmentId)) {
        latestByEnrollment.set(rc.enrollmentId, rc);
      }
    }

    const result = new Map<
      string,
      { passed: boolean; percentage: number | null }
    >();
    for (const enrollmentId of enrollmentIds) {
      result.set(
        enrollmentId,
        this.evaluatePassStatus(latestByEnrollment.get(enrollmentId), threshold),
      );
    }
    return result;
  }

  async preview(dto: PreviewPromotionDto) {
    const threshold = dto.passThreshold ?? DEFAULT_PASS_THRESHOLD;
    const classes = await this.prisma.class.findMany({
      where: { sessionId: dto.fromSessionId, status: 'Active' },
      include: {
        sections: {
          include: {
            enrollments: {
              where: { status: 'Enrolled' },
              include: { student: true },
            },
          },
        },
      },
      orderBy: { grade: 'asc' },
    });

    const allEnrollmentIds = classes.flatMap((cls) =>
      cls.sections.flatMap((s) => s.enrollments.map((e) => e.id)),
    );
    const passStatuses = await this.batchPassStatuses(
      allEnrollmentIds,
      dto.fromSessionId,
      threshold,
    );

    const results: {
      classId: string;
      grade: string;
      nextGrade: string | null;
      isFinalGrade: boolean;
      totalStudents: number;
      passing: number;
      failing: number;
      failingStudents: {
        studentId: string;
        enrollmentId: string;
        fullName: string;
        percentage: number | null;
      }[];
    }[] = [];
    for (const cls of classes) {
      const enrollments = cls.sections.flatMap((s) => s.enrollments);
      let passing = 0;
      let failing = 0;
      const failingStudents: {
        studentId: string;
        enrollmentId: string;
        fullName: string;
        percentage: number | null;
      }[] = [];
      for (const enr of enrollments) {
        const { passed, percentage } = passStatuses.get(enr.id)!;
        if (passed) passing++;
        else {
          failing++;
          failingStudents.push({
            studentId: enr.studentId,
            enrollmentId: enr.id,
            fullName: enr.student.fullName,
            percentage,
          });
        }
      }
      results.push({
        classId: cls.id,
        grade: cls.grade,
        nextGrade: nextGradeOf(cls.grade),
        isFinalGrade: nextGradeOf(cls.grade) === null,
        totalStudents: enrollments.length,
        passing,
        failing,
        failingStudents,
      });
    }

    // When every class in this session has 0 remaining enrolled students,
    // it isn't an empty/broken result — it means every student here was
    // already promoted/graduated/repeated in a prior commit. Surface that
    // explicitly so the UI can explain it instead of just showing zeros.
    const alreadyPromoted = results.length > 0 && results.every((r) => r.totalStudents === 0);

    return {
      fromSessionId: dto.fromSessionId,
      passThreshold: threshold,
      classes: results,
      alreadyPromoted,
    };
  }

  private async getOrCreateClass(
    grade: string,
    campusId: string,
    sessionId: string,
  ) {
    const existing = await this.prisma.class.findFirst({
      where: { grade, campusId, sessionId },
    });
    if (existing) return existing;

    const created = await this.prisma.class.create({
      data: {
        grade,
        campusId,
        sessionId,
        sections: { create: [{ name: 'A' }, { name: 'B' }] },
      },
      include: { sections: true },
    });

    // A brand-new class has no curriculum (ClassSubject) yet — without it,
    // nothing downstream (Auto-Generate Timetable, homework/exam subject
    // pickers) can work for this class. Subject curriculum is consistent
    // per grade regardless of session/cohort (unlike teacher staffing,
    // which genuinely changes year to year and stays a deliberate admin
    // step), so reconstruct it from whatever other session already has a
    // "grade" class with subjects configured — normally the source
    // session's own seed data.
    const referenceClass = await this.prisma.class.findFirst({
      where: { grade, campusId, subjects: { some: {} } },
      include: { subjects: true },
    });
    if (referenceClass && referenceClass.subjects.length > 0) {
      await this.prisma.classSubject.createMany({
        data: referenceClass.subjects.map((cs) => ({
          classId: created.id,
          subjectId: cs.subjectId,
        })),
        skipDuplicates: true,
      });
    }

    return created;
  }

  async commit(dto: CommitPromotionDto) {
    const threshold = dto.passThreshold ?? DEFAULT_PASS_THRESHOLD;
    const holdBack = new Set(dto.holdBackStudentIds || []);
    const forcePromote = new Set(dto.forcePromoteStudentIds || []);

    const fromSession = await this.prisma.academicSession.findUnique({
      where: { id: dto.fromSessionId },
    });
    if (!fromSession) throw new NotFoundException('Source session not found');

    let toSession = dto.toSessionId
      ? await this.prisma.academicSession.findUnique({
          where: { id: dto.toSessionId },
        })
      : null;
    if (!toSession) {
      if (!dto.toSessionName)
        throw new BadRequestException('Provide toSessionId or toSessionName');
      toSession = await this.prisma.academicSession.findFirst({
        where: { name: dto.toSessionName },
      });
      if (!toSession) {
        toSession = await this.prisma.academicSession.create({
          data: { name: dto.toSessionName, isActive: false, status: 'Active' },
        });
      }
    }
    if (toSession.id === fromSession.id)
      throw new BadRequestException(
        'Target session must be different from source session',
      );

    const classes = await this.prisma.class.findMany({
      where: { sessionId: dto.fromSessionId, status: 'Active' },
      include: {
        sections: {
          include: {
            enrollments: {
              where: { status: 'Enrolled' },
              include: { student: true },
            },
          },
        },
      },
      orderBy: { grade: 'asc' },
    });

    // Track section fill counts for balanced round-robin assignment into target classes.
    const sectionCounts = new Map<string, number>(); // classId -> section index cursor
    const targetClassCache = new Map<
      string,
      { id: string; sections: { id: string }[] }
    >();

    const getBalancedSection = async (grade: string, campusId: string) => {
      const key = `${grade}_${campusId}`;
      let cls = targetClassCache.get(key);
      if (!cls) {
        const created = await this.getOrCreateClass(
          grade,
          campusId,
          toSession.id,
        );
        cls = {
          id: created.id,
          sections:
            (created as any).sections ??
            (await this.prisma.section.findMany({
              where: { classId: created.id },
            })),
        };
        targetClassCache.set(key, cls);
        const counts = await Promise.all(
          cls.sections.map((s) =>
            this.prisma.studentEnrollment.count({
              where: { sectionId: s.id, sessionId: toSession.id },
            }),
          ),
        );
        cls.sections.forEach((s, i) => sectionCounts.set(s.id, counts[i]));
      }
      let minSection = cls.sections[0];
      let minCount = sectionCounts.get(minSection.id) ?? 0;
      for (const s of cls.sections) {
        const c = sectionCounts.get(s.id) ?? 0;
        if (c < minCount) {
          minCount = c;
          minSection = s;
        }
      }
      sectionCounts.set(minSection.id, minCount + 1);
      return minSection;
    };

    let promotedCount = 0;
    let repeatedCount = 0;
    let graduatedCount = 0;

    const allEnrollmentIds = classes.flatMap((cls) =>
      cls.sections.flatMap((s) => s.enrollments.map((e) => e.id)),
    );
    const passStatuses = await this.batchPassStatuses(
      allEnrollmentIds,
      dto.fromSessionId,
      threshold,
    );

    for (const cls of classes) {
      const nextGrade = nextGradeOf(cls.grade);
      const enrollments = cls.sections.flatMap((s) => s.enrollments);

      for (let i = 0; i < enrollments.length; i++) {
        const enr = enrollments[i];
        let passed: boolean;
        if (forcePromote.has(enr.studentId)) passed = true;
        else if (holdBack.has(enr.studentId)) passed = false;
        else passed = passStatuses.get(enr.id)!.passed;

        if (passed && nextGrade) {
          const section = await getBalancedSection(nextGrade, cls.campusId);
          await this.prisma.studentEnrollment.create({
            data: {
              studentId: enr.studentId,
              sessionId: toSession.id,
              sectionId: section.id,
              rollNumber: enr.rollNumber,
              status: 'Enrolled',
              campusId: enr.campusId,
            },
          });
          await this.prisma.studentEnrollment.update({
            where: { id: enr.id },
            data: { status: 'Promoted' },
          });
          promotedCount++;
        } else if (passed && !nextGrade) {
          await this.prisma.studentEnrollment.update({
            where: { id: enr.id },
            data: { status: 'Graduated' },
          });
          await this.prisma.student.update({
            where: { id: enr.studentId },
            data: { status: 'Alumni' },
          });
          graduatedCount++;
        } else {
          // Held back — repeats the same grade next session.
          const section = await getBalancedSection(cls.grade, cls.campusId);
          await this.prisma.studentEnrollment.create({
            data: {
              studentId: enr.studentId,
              sessionId: toSession.id,
              sectionId: section.id,
              rollNumber: enr.rollNumber,
              status: 'Enrolled',
              campusId: enr.campusId,
            },
          });
          await this.prisma.studentEnrollment.update({
            where: { id: enr.id },
            data: { status: 'Repeated' },
          });
          repeatedCount++;
        }
      }
    }

    return {
      fromSessionId: fromSession.id,
      toSessionId: toSession.id,
      toSessionName: toSession.name,
      promoted: promotedCount,
      repeated: repeatedCount,
      graduated: graduatedCount,
      total: promotedCount + repeatedCount + graduatedCount,
    };
  }
}
