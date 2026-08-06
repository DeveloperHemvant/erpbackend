import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfileByStudent(studentId: string) {
    return this.prisma.healthProfile.findUnique({ where: { studentId } });
  }

  upsertProfile(
    studentId: string,
    data: Omit<Prisma.HealthProfileUncheckedCreateInput, 'studentId'>,
  ) {
    return this.prisma.healthProfile.upsert({
      where: { studentId },
      update: data,
      create: { ...data, studentId },
    });
  }

  createVisit(data: Prisma.HealthVisitUncheckedCreateInput) {
    return this.prisma.healthVisit.create({
      data,
      include: { student: true, loggedByStaff: true },
    });
  }

  findVisitsForStudent(studentId: string) {
    return this.prisma.healthVisit.findMany({
      where: { studentId },
      include: { loggedByStaff: true },
      orderBy: { visitDate: 'desc' },
    });
  }

  findVisitsForDate(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.prisma.healthVisit.findMany({
      where: { visitDate: { gte: start, lte: end } },
      include: { student: true, loggedByStaff: true },
      orderBy: { visitDate: 'desc' },
    });
  }

  createVaccination(data: Prisma.VaccinationUncheckedCreateInput) {
    return this.prisma.vaccination.create({ data });
  }

  findVaccinationsForStudent(studentId: string) {
    return this.prisma.vaccination.findMany({
      where: { studentId },
      orderBy: { dateAdministered: 'desc' },
    });
  }
}
