import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  createFromDto(data: Prisma.ReportCardUncheckedCreateInput) {
    return this.prisma.reportCard.create({
      data,
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
      },
    });
  }

  findAll() {
    return this.prisma.reportCard.findMany({
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.reportCard.findUnique({ where: { id } });
  }

  findByIdWithContext(id: string) {
    return this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        exam: true,
      },
    });
  }

  updateApproval(id: string, isApproved: boolean, remarks?: string) {
    return this.prisma.reportCard.update({
      where: { id },
      data: { isApproved, ...(remarks !== undefined && { remarks }) },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
      },
    });
  }

  delete(id: string) {
    return this.prisma.reportCard.delete({ where: { id } });
  }

  updateSignature(id: string, signatureAttachmentId?: string) {
    return this.prisma.reportCard.update({
      where: { id },
      data: {
        parentSigned: true,
        parentSignedAt: new Date(),
        ...(signatureAttachmentId !== undefined && { signatureAttachmentId }),
      },
    });
  }

  findByEnrollmentAndExam(enrollmentId: string, examId: string) {
    return this.prisma.reportCard.findFirst({
      where: { enrollmentId, examId },
    });
  }

  updateComputed(id: string, gpa: string, computedData: any) {
    return this.prisma.reportCard.update({
      where: { id },
      data: { gpa, computedData },
      include: { enrollment: true, exam: true },
    });
  }

  createComputed(
    enrollmentId: string,
    examId: string,
    attendanceRate: string,
    gpa: string,
    computedData: any,
  ) {
    return this.prisma.reportCard.create({
      data: {
        enrollmentId,
        examId,
        attendanceRate,
        gpa,
        computedData,
        createdBy: 'SYSTEM',
      },
      include: { enrollment: true, exam: true },
    });
  }
}
