import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RequestUser {
  userId: string;
  role: string;
}

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every caller of this — StudentAccessGuard, StudentAccessOrPermissionGuard,
   * and EmsService's own-attempt check — uses it on routes meant ONLY for the
   * student themself or their parent (staff have separate, permission-gated
   * routes for the same data). So a non-portal role must be rejected here,
   * not waved through: there is no legitimate staff caller of this method.
   */
  async assertOwnsStudent(user: RequestUser, studentId: string): Promise<void> {
    const role = (user.role || '').toLowerCase();

    if (role === 'student') {
      if (user.userId === studentId) return;
      throw new ForbiddenException('You do not have access to this student.');
    }

    if (role === 'parent') {
      const link = await this.prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: user.userId, studentId } },
      });
      if (link) return;
      throw new ForbiddenException('You do not have access to this student.');
    }

    throw new ForbiddenException('You do not have access to this student.');
  }

  /**
   * Same self/parent ownership rule as assertOwnsStudent, but keyed by an
   * Enrollment id (what hostel outpasses, and several other student-facing
   * request flows, are actually scoped by) rather than a Student id directly.
   */
  async assertOwnsEnrollment(
    user: RequestUser,
    enrollmentId: string | undefined,
  ): Promise<void> {
    if (!enrollmentId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { studentId: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsStudent(user, enrollment.studentId);
  }

  /** Resolves a HostelOutpass id to its owning enrollment, then defers to the
   * same ownership rule — lets a student/parent act on (e.g. attach a file
   * to) their own outpass request without holding MANAGE_HOSTEL. */
  async assertOwnsHostelOutpass(
    user: RequestUser,
    outpassId: string | undefined,
  ): Promise<void> {
    if (!outpassId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const outpass = await this.prisma.hostelOutpass.findUnique({
      where: { id: outpassId },
      select: { enrollmentId: true },
    });
    if (!outpass) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsEnrollment(user, outpass.enrollmentId);
  }

  /** Resolves a SchoolDiaryEntry id to its student, then defers to the same
   * ownership rule — lets a parent sign their own child's diary entry
   * without holding MANAGE_DIARY (see PortalController's diary sign route). */
  async assertOwnsDiaryEntry(
    user: RequestUser,
    entryId: string | undefined,
  ): Promise<void> {
    if (!entryId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const entry = await this.prisma.schoolDiaryEntry.findUnique({
      where: { id: entryId },
      select: { studentId: true },
    });
    if (!entry) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsStudent(user, entry.studentId);
  }

  /** Resolves a ReportCard id -> enrollment -> student, then defers to the
   * same ownership rule — lets a student/parent download their own report
   * card PDF without holding MANAGE_EXAMS. */
  async assertOwnsReportCard(
    user: RequestUser,
    reportCardId: string | undefined,
  ): Promise<void> {
    if (!reportCardId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const reportCard = await this.prisma.reportCard.findUnique({
      where: { id: reportCardId },
      select: { enrollmentId: true },
    });
    if (!reportCard) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsEnrollment(user, reportCard.enrollmentId);
  }

  /** Resolves a FeePayment id to its invoice's enrollment, then defers to the
   * same ownership rule — lets a parent/student download their own fee
   * receipt without holding MANAGE_FEES/PAY_FEES. */
  async assertOwnsFeePayment(
    user: RequestUser,
    paymentId: string | undefined,
  ): Promise<void> {
    if (!paymentId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const payment = await this.prisma.feePayment.findUnique({
      where: { id: paymentId },
      select: { invoice: { select: { enrollmentId: true } } },
    });
    if (!payment) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsEnrollment(user, payment.invoice.enrollmentId);
  }

  /** Resolves a ConsentResponse id to its student, then defers to the same
   * ownership rule — lets a parent respond to their own child's consent
   * request without holding MANAGE_COMMUNICATION. */
  async assertOwnsConsentResponse(
    user: RequestUser,
    responseId: string | undefined,
  ): Promise<void> {
    if (!responseId) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    const response = await this.prisma.consentResponse.findUnique({
      where: { id: responseId },
      select: { studentId: true },
    });
    if (!response) {
      throw new ForbiddenException('You do not have access to this record.');
    }
    await this.assertOwnsStudent(user, response.studentId);
  }
}
