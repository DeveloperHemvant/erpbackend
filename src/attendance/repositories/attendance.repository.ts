import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';
import { requireCampusId } from '../../prisma/tenant-context';

function campusFilter(tenantContext: TenantContext): { campusId: string } | {} {
  return tenantContext.canAccessAllCampuses
    ? {}
    : { campusId: requireCampusId(tenantContext) };
}

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCampus() {
    return this.prisma.campus.findFirst();
  }

  // Campus Isolation Phase 3, Milestone 7 — lean lookups for
  // logAttendance()'s two-path campusId derivation (enrollment vs. staff
  // self-attendance) and for updateAttendance/deleteAttendance's ownership
  // check before mutating.
  async findEnrollmentCampusId(enrollmentId: string): Promise<string | null> {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { campusId: true },
    });
    return enrollment?.campusId ?? null;
  }

  async findStaffCampusId(staffId: string): Promise<string | null> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { campusId: true },
    });
    return staff?.campusId ?? null;
  }

  findById(id: string) {
    return this.prisma.attendanceRecord.findUnique({
      where: { id },
      select: { id: true, campusId: true },
    });
  }

  create(data: Prisma.AttendanceRecordUncheckedCreateInput) {
    return this.prisma.attendanceRecord.create({
      data,
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        staff: true,
      },
    });
  }

  findMany(
    where: Prisma.AttendanceRecordWhereInput,
    tenantContext: TenantContext,
  ) {
    return this.prisma.attendanceRecord.findMany({
      where: { ...where, ...campusFilter(tenantContext) },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        staff: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  /** Class/Section 360 Attendance Summary tab (IA §4) — count by status for one section. */
  summaryBySection(sectionId: string, tenantContext: TenantContext) {
    return this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        enrollment: {
          sectionId,
          ...(tenantContext.canAccessAllCampuses
            ? {}
            : {
                section: {
                  class: { campusId: requireCampusId(tenantContext) },
                },
              }),
        },
      },
      _count: { _all: true },
    });
  }

  update(id: string, data: Prisma.AttendanceRecordUncheckedUpdateInput) {
    return this.prisma.attendanceRecord.update({
      where: { id },
      data,
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        staff: true,
      },
    });
  }

  delete(id: string) {
    return this.prisma.attendanceRecord.delete({ where: { id } });
  }
}
