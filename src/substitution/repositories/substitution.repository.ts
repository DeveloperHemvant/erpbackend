import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubstitutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSubstitution(data: Prisma.TeacherSubstitutionUncheckedCreateInput) {
    return this.prisma.teacherSubstitution.create({
      data,
      include: {
        primaryTeacher: true,
        substituteTeacher: true,
        timetablePeriod: { include: { section: true, subject: true } },
      },
    });
  }

  findSubstitutions(where?: Prisma.TeacherSubstitutionWhereInput) {
    return this.prisma.teacherSubstitution.findMany({
      where,
      include: {
        primaryTeacher: true,
        substituteTeacher: true,
        timetablePeriod: { include: { section: true, subject: true } },
      },
      orderBy: { date: 'desc' },
    });
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
}
