import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createAssembly(data: Prisma.MorningAssemblyUncheckedCreateInput) {
    return this.prisma.morningAssembly.create({ data });
  }

  findAssemblies(where?: Prisma.MorningAssemblyWhereInput) {
    return this.prisma.morningAssembly.findMany({
      where,
      include: {
        campus: true,
        performingSection: true,
        supervisingStaff: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  createHouse(data: Prisma.SchoolHouseUncheckedCreateInput) {
    return this.prisma.schoolHouse.create({
      data,
      include: { captain: true, viceCaptain: true, teacherIncharge: true },
    });
  }

  updateHouse(houseId: string, data: Prisma.SchoolHouseUncheckedUpdateInput) {
    return this.prisma.schoolHouse.update({
      where: { id: houseId },
      data,
      include: { captain: true, viceCaptain: true, teacherIncharge: true },
    });
  }

  findHouseById(houseId: string) {
    return this.prisma.schoolHouse.findUnique({ where: { id: houseId } });
  }

  updateHousePoints(houseId: string, points: number) {
    return this.prisma.schoolHouse.update({
      where: { id: houseId },
      data: { points: { increment: points } },
    });
  }

  findHouses() {
    return this.prisma.schoolHouse.findMany({
      include: {
        captain: true,
        viceCaptain: true,
        teacherIncharge: true,
        _count: { select: { members: true } },
      },
      orderBy: { points: 'desc' },
    });
  }

  findHouseMembers(houseId: string) {
    return this.prisma.student.findMany({
      where: { houseId },
      orderBy: { fullName: 'asc' },
    });
  }

  createAchievement(data: Prisma.StudentAchievementUncheckedCreateInput) {
    return this.prisma.studentAchievement.create({
      data,
      include: { student: true, issuedBy: true },
    });
  }

  findAchievementsByStudent(studentId: string) {
    return this.prisma.studentAchievement.findMany({
      where: { studentId },
      include: { issuedBy: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  createStaffDuty(data: Prisma.StaffDutyAllocationUncheckedCreateInput) {
    return this.prisma.staffDutyAllocation.create({
      data,
      include: { staff: true },
    });
  }

  findStaffDuties(where?: Prisma.StaffDutyAllocationWhereInput) {
    return this.prisma.staffDutyAllocation.findMany({
      where,
      include: { staff: true },
      orderBy: { date: 'desc' },
    });
  }
}
