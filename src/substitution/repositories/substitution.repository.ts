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
        timetablePeriod: true,
      },
    });
  }

  findSubstitutions(where?: Prisma.TeacherSubstitutionWhereInput) {
    return this.prisma.teacherSubstitution.findMany({
      where,
      include: {
        primaryTeacher: true,
        substituteTeacher: true,
        timetablePeriod: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
