import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRequest(data: Prisma.ConsentRequestUncheckedCreateInput) {
    return this.prisma.consentRequest.create({ data });
  }

  createResponses(rows: Prisma.ConsentResponseUncheckedCreateInput[]) {
    return this.prisma.consentResponse.createMany({ data: rows });
  }

  findActiveStudentIds() {
    return this.prisma.student
      .findMany({ where: { status: 'Active' }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));
  }

  findEnrolledStudentIdsInSection(sectionId: string) {
    return this.prisma.studentEnrollment
      .findMany({
        where: { sectionId, status: 'Enrolled' },
        select: { studentId: true },
        distinct: ['studentId'],
      })
      .then((rows) => rows.map((r) => r.studentId));
  }

  findRequests() {
    return this.prisma.consentRequest.findMany({
      include: {
        createdBy: { select: { id: true, fullName: true } },
        targetSection: {
          select: { id: true, name: true, class: { select: { grade: true } } },
        },
        _count: { select: { responses: true } },
        responses: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRequestById(id: string) {
    return this.prisma.consentRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        targetSection: {
          select: { id: true, name: true, class: { select: { grade: true } } },
        },
        responses: {
          include: {
            student: { select: { id: true, fullName: true, admissionNumber: true } },
            respondedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findResponseById(id: string) {
    return this.prisma.consentResponse.findUnique({ where: { id } });
  }

  findChildStudentIds(parentId: string) {
    return this.prisma.parentStudent
      .findMany({ where: { parentId }, select: { studentId: true } })
      .then((rows) => rows.map((r) => r.studentId));
  }

  findResponsesForParent(studentIds: string[]) {
    return this.prisma.consentResponse.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        consentRequest: true,
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateResponse(id: string, data: Prisma.ConsentResponseUncheckedUpdateInput) {
    return this.prisma.consentResponse.update({ where: { id }, data });
  }
}
