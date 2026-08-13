import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { StudentRepository } from './repositories/student.repository';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateParentCredentialsDto,
  SetupParentPortalDto,
} from './dto/student.dto';
import type { TenantContext } from '../prisma/tenant-context';

@Injectable()
export class StudentsService {
  constructor(private readonly studentRepository: StudentRepository) {}

  // Campus Isolation Phase 3, Milestone 5 — cross-tenant direct-by-id
  // access throws the same NotFoundException a genuinely-missing id
  // already throws, not a new 403 branch (same reasoning as staff.service.ts).
  // A Draft (never-enrolled) student has zero enrollments and therefore no
  // campus signal at all — restricting on an empty array would 404 the
  // very admin who just admitted them, before they've been assigned a
  // class/section. Left accessible in that state (matches today's status
  // quo, not a new gap this milestone introduces); the check only takes
  // effect once at least one enrollment — and therefore a real campus —
  // exists.
  private assertStudentAccessible(
    enrollmentCampusIds: (string | null)[],
    tenantContext: TenantContext,
    id: string,
  ) {
    if (
      enrollmentCampusIds.length > 0 &&
      !tenantContext.canAccessAllCampuses &&
      !enrollmentCampusIds.includes(tenantContext.campusId)
    ) {
      throw new NotFoundException(`Student record not found.`);
    }
  }

  // ==========================================
  // STUDENT ADMISSIONS (FULL CRUD)
  // ==========================================
  async createStudent(dto: CreateStudentDto) {
    const existing = await this.studentRepository.findByAdmissionNumber(
      dto.admissionNumber,
    );
    if (existing) {
      throw new ConflictException(
        `Admission number ${dto.admissionNumber} already exists.`,
      );
    }

    const { classId, sectionId, documentsVerified, ...rest } = dto;
    const emailId = rest.details?.emailId;

    if (!emailId) {
      throw new BadRequestException(
        'Parent Email ID is required in details for portal account setup.',
      );
    }

    let parent = await this.studentRepository.findParentByEmail(emailId);

    let generatedPassword: string | null = null;

    if (!parent) {
      generatedPassword = `Parent@${Math.floor(1000 + Math.random() * 9000)}`;
      const passwordHash = await bcrypt.hash(generatedPassword, 10);

      parent = await this.studentRepository.createParent({
        name: rest.guardianName,
        phone: rest.phone,
        email: emailId,
        passwordHash,
      });

      await this.studentRepository.createPortalAccount({
        username: emailId,
        passwordHash,
        userType: 'PARENT',
        referenceId: parent.id,
      });
    }

    const student = await this.studentRepository.create({
      admissionNumber: rest.admissionNumber,
      fullName: rest.fullName,
      gender: rest.gender,
      guardianName: rest.guardianName,
      phone: rest.phone,
      status: rest.status || 'Draft',
      documentsVerified: documentsVerified || false,
      details: rest.details || {},
      createdBy: 'SYSTEM',
    });

    await this.studentRepository.createParentStudentLink({
      parentId: parent.id,
      studentId: student.id,
      relationship: 'Parent',
    });

    if (student.status === 'Active' && classId) {
      await this.enrollStudent(student.id, classId, sectionId);
    }

    return {
      ...student,
      generatedPassword,
      parentUsername: emailId,
      parentName: parent.name,
      isNewParent: !!generatedPassword,
    };
  }

  async getStudents(
    tenantContext: TenantContext,
    page?: number,
    limit?: number,
    sectionId?: string,
    search?: string,
  ) {
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, totalCount] = await Promise.all([
        this.studentRepository.findPage(
          skip,
          limit,
          tenantContext,
          sectionId,
          search,
        ),
        this.studentRepository.count(tenantContext, sectionId, search),
      ]);
      return { data, totalCount, page, limit };
    }

    const data = await this.studentRepository.findAll(
      tenantContext,
      sectionId,
      search,
    );
    return { data, totalCount: data.length, page: 1, limit: data.length };
  }

  async updateStudent(
    id: string,
    dto: UpdateStudentDto,
    tenantContext: TenantContext,
  ) {
    const student = await this.studentRepository.findById(id);
    if (!student) throw new NotFoundException(`Student record not found.`);
    const enrollmentCampusIds =
      await this.studentRepository.findEnrollmentCampusIds(id);
    this.assertStudentAccessible(enrollmentCampusIds, tenantContext, id);

    const { classId, sectionId, ...rest } = dto;

    const updatedStudent = await this.studentRepository.update(id, {
      ...rest,
      updatedBy: 'SYSTEM',
    });

    if (updatedStudent.status === 'Active' && classId) {
      // Check if they are already enrolled in an active session
      const activeSession =
        await this.studentRepository.findActiveAcademicSession();
      if (activeSession) {
        const existingEnrollment =
          await this.studentRepository.findEnrollmentByStudentAndSession(
            id,
            activeSession.id,
          );
        if (!existingEnrollment) {
          await this.enrollStudent(id, classId, sectionId);
        }
      }
    }

    return updatedStudent;
  }

  private async enrollStudent(
    studentId: string,
    classId: string,
    providedSectionId?: string,
  ) {
    const activeSession =
      await this.studentRepository.findActiveAcademicSession();
    if (!activeSession) return;

    let sectionIdToUse = providedSectionId;
    if (!sectionIdToUse) {
      const firstSection =
        await this.studentRepository.findFirstSectionByClass(classId);
      if (firstSection) sectionIdToUse = firstSection.id;
    }

    if (!sectionIdToUse) return; // Cannot enroll if no section exists

    // Generate Roll Number (count existing enrollments in this section + 1)
    const count = await this.studentRepository.countEnrollmentsInSection(
      sectionIdToUse,
      activeSession.id,
    );

    // Fetch section name for prefix
    const section =
      await this.studentRepository.findSectionWithClassGrade(sectionIdToUse);
    const prefix = section
      ? `${section.class.grade.replace(/\s+/g, '')}${section.name}`
      : 'ROLL';
    const rollNumber = `${prefix}-${String(count + 1).padStart(3, '0')}`;

    // Campus Isolation Phase 3, Milestone 5 — explicit, not ambient. This
    // used to rely entirely on the legacy Prisma middleware's AsyncLocalStorage
    // injection, which is undefined (no campusId gets set at all) for any
    // canAccessAllCampuses caller, and otherwise fills in the ACTING STAFF's
    // own campus rather than the campus the enrolled Class actually belongs
    // to. The section (and its class) was already fetched above — its
    // campusId is the actually-correct source of truth regardless of caller.
    await this.studentRepository.createEnrollment({
      studentId,
      sessionId: activeSession.id,
      sectionId: sectionIdToUse,
      rollNumber,
      status: 'Enrolled',
      createdBy: 'SYSTEM',
      campusId: section?.class.campusId,
    });
  }

  async getStudentProfile(id: string, tenantContext: TenantContext) {
    const student = await this.studentRepository.findProfileById(id);
    if (!student) throw new NotFoundException(`Student record not found.`);
    this.assertStudentAccessible(
      student.enrollments.map((e) => e.campusId),
      tenantContext,
      id,
    );
    return student;
  }

  async updateParentCredentials(
    parentId: string,
    dto: UpdateParentCredentialsDto,
  ) {
    const parent = await this.studentRepository.findParentById(parentId);
    if (!parent) throw new NotFoundException('Parent not found.');

    const updateData: any = {};
    const portalUpdateData: any = {};

    if (dto.email) {
      // Check if email is already taken by another parent
      const existing = await this.studentRepository.findParentByEmailExcluding(
        dto.email,
        parentId,
      );
      if (existing)
        throw new ConflictException('Email already in use by another account.');
      updateData.email = dto.email;
      portalUpdateData.username = dto.email;
    }

    if (dto.password) {
      const hash = await bcrypt.hash(dto.password, 10);
      updateData.passwordHash = hash;
      portalUpdateData.passwordHash = hash;
    }

    if (Object.keys(updateData).length > 0) {
      await this.studentRepository.updateParent(parentId, updateData);

      // Try updating portal account if it exists
      const portalAccount =
        await this.studentRepository.findPortalAccountByReference(
          parentId,
          'PARENT',
        );
      if (portalAccount) {
        await this.studentRepository.updatePortalAccount(
          portalAccount.id,
          portalUpdateData,
        );
      } else if (dto.email && dto.password) {
        // Create if missing
        await this.studentRepository.createPortalAccount({
          username: dto.email,
          passwordHash: portalUpdateData.passwordHash || parent.passwordHash,
          userType: 'PARENT',
          referenceId: parentId,
        });
      }
    }

    return { success: true, message: 'Credentials updated successfully.' };
  }

  async setupParentPortal(studentId: string, dto: SetupParentPortalDto) {
    const student = await this.studentRepository.findById(studentId);
    if (!student) throw new NotFoundException('Student not found.');

    let parent = await this.studentRepository.findParentByEmail(dto.email);

    const generatedPassword =
      dto.password || `Parent@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    if (!parent) {
      parent = await this.studentRepository.createParent({
        name: student.guardianName || 'Parent',
        phone: student.phone,
        email: dto.email,
        passwordHash,
      });

      await this.studentRepository.createPortalAccount({
        username: dto.email,
        passwordHash,
        userType: 'PARENT',
        referenceId: parent.id,
      });
    }

    // Link parent to student
    const existingLink = await this.studentRepository.findParentStudentLink(
      parent.id,
      studentId,
    );

    if (!existingLink) {
      await this.studentRepository.createParentStudentLink({
        parentId: parent.id,
        studentId,
        relationship: dto.relationship || 'Parent',
      });
    }

    return { success: true, message: 'Parent portal setup successfully.' };
  }

  async deleteStudent(id: string, tenantContext: TenantContext) {
    const enrollmentCampusIds =
      await this.studentRepository.findEnrollmentCampusIds(id);
    this.assertStudentAccessible(enrollmentCampusIds, tenantContext, id);
    return this.studentRepository.delete(id);
  }

  async getCertificates(enrollmentId: string) {
    // Generate mock certificate payloads. The route param is named `id` under `students/:id/...`
    // for URL consistency, but the frontend actually passes an enrollment id here.
    const enr =
      await this.studentRepository.findEnrollmentWithStudentAndSection(
        enrollmentId,
      );

    if (!enr) throw new NotFoundException('Enrollment not found');

    return {
      bonafide: {
        title: 'BONAFIDE CERTIFICATE',
        studentName: enr.student.fullName,
        admissionNumber: enr.student.admissionNumber,
        className: enr.section.class.grade,
        date: new Date().toISOString().split('T')[0],
        message: `This is to certify that ${enr.student.fullName} is a bonafide student of this institution studying in ${enr.section.class.grade}.`,
      },
      transfer: {
        title: 'TRANSFER CERTIFICATE',
        studentName: enr.student.fullName,
        admissionNumber: enr.student.admissionNumber,
        date: new Date().toISOString().split('T')[0],
        message: `Certified that ${enr.student.fullName} has cleared all dues and is transferring from the school.`,
      },
    };
  }
}
