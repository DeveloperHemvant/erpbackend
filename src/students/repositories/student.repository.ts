import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAdmissionNumber(admissionNumber: string) {
    return this.prisma.student.findUnique({ where: { admissionNumber } });
  }

  create(data: Prisma.StudentCreateInput) {
    return this.prisma.student.create({ data });
  }

  findAll(sectionId?: string) {
    return this.prisma.student.findMany({
      where: sectionId ? { enrollments: { some: { sectionId } } } : undefined,
      orderBy: { fullName: "asc" },
      include: { enrollments: { include: { section: { include: { class: true } } } }, house: true },
    });
  }

  findPage(skip: number, take: number, sectionId?: string) {
    return this.prisma.student.findMany({
      where: sectionId ? { enrollments: { some: { sectionId } } } : undefined,
      skip,
      take,
      orderBy: { fullName: "asc" },
      include: { enrollments: { include: { section: { include: { class: true } } } }, house: true },
    });
  }

  count(sectionId?: string) {
    return this.prisma.student.count({
      where: sectionId ? { enrollments: { some: { sectionId } } } : undefined,
    });
  }

  findById(id: string) {
    return this.prisma.student.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.StudentUpdateInput) {
    return this.prisma.student.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }

  findProfileById(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        documents: true,
        house: true,
        admissionInquiry: true,
        parents: {
          include: {
            parent: true,
          },
        },
        enrollments: {
          include: {
            session: true,
            section: {
              include: {
                class: {
                  include: {
                    subjects: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
                assignments: {
                  where: { subjectId: null },
                  include: {
                    staff: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findActiveAcademicSession() {
    return this.prisma.academicSession.findFirst({ where: { isActive: true } });
  }

  findFirstSectionByClass(classId: string) {
    return this.prisma.section.findFirst({ where: { classId } });
  }

  countEnrollmentsInSection(sectionId: string, sessionId: string) {
    return this.prisma.studentEnrollment.count({ where: { sectionId, sessionId } });
  }

  findSectionWithClassGrade(sectionId: string) {
    return this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  createEnrollment(data: Prisma.StudentEnrollmentUncheckedCreateInput) {
    return this.prisma.studentEnrollment.create({ data });
  }

  findEnrollmentByStudentAndSession(studentId: string, sessionId: string) {
    return this.prisma.studentEnrollment.findFirst({ where: { studentId, sessionId } });
  }

  findEnrollmentWithStudentAndSection(enrollmentId: string) {
    return this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, section: { include: { class: true } } },
    });
  }

  findParentByEmail(email: string) {
    return this.prisma.parent.findUnique({ where: { email } });
  }

  findParentById(id: string) {
    return this.prisma.parent.findUnique({ where: { id } });
  }

  findParentByEmailExcluding(email: string, excludeParentId: string) {
    return this.prisma.parent.findFirst({ where: { email, id: { not: excludeParentId } } });
  }

  createParent(data: Prisma.ParentCreateInput) {
    return this.prisma.parent.create({ data });
  }

  updateParent(id: string, data: Prisma.ParentUpdateInput) {
    return this.prisma.parent.update({ where: { id }, data });
  }

  createParentStudentLink(data: Prisma.ParentStudentUncheckedCreateInput) {
    return this.prisma.parentStudent.create({ data });
  }

  findParentStudentLink(parentId: string, studentId: string) {
    return this.prisma.parentStudent.findFirst({ where: { parentId, studentId } });
  }

  findPortalAccountByReference(referenceId: string, userType: string) {
    return this.prisma.portalAccount.findFirst({ where: { referenceId, userType } });
  }

  createPortalAccount(data: Prisma.PortalAccountCreateInput) {
    return this.prisma.portalAccount.create({ data });
  }

  updatePortalAccount(id: string, data: Prisma.PortalAccountUpdateInput) {
    return this.prisma.portalAccount.update({ where: { id }, data });
  }
}
