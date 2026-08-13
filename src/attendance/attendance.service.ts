import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommunicationService } from '../communication/communication.service';
import { AttendanceRepository } from './repositories/attendance.repository';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import type { TenantContext } from '../prisma/tenant-context';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly commService: CommunicationService,
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async logAttendance(
    dto: CreateAttendanceDto & { latitude?: number; longitude?: number },
    tenantContext: TenantContext,
  ) {
    // Campus Isolation Phase 3, Milestone 7 — a record is either about a
    // student (enrollmentId) or staff self-attendance (staffId), mutually
    // intended-exclusive per the DTO. Derive campus from whichever is
    // actually set, explicitly, rather than relying on the legacy
    // middleware's ambient injection (same bug shape as Milestones 5/6 —
    // null for every canAccessAllCampuses caller, and otherwise the
    // acting staff's own campus, not necessarily the record's).
    let recordCampusId: string | null = null;
    if (dto.enrollmentId) {
      recordCampusId = await this.attendanceRepository.findEnrollmentCampusId(
        dto.enrollmentId,
      );
    } else if (dto.staffId) {
      recordCampusId = await this.attendanceRepository.findStaffCampusId(
        dto.staffId,
      );
    }

    if (
      recordCampusId &&
      !tenantContext.canAccessAllCampuses &&
      recordCampusId !== tenantContext.campusId
    ) {
      throw new ForbiddenException(
        'Cannot log attendance for a student or staff member outside your campus.',
      );
    }

    if (dto.latitude && dto.longitude) {
      const campus = await this.attendanceRepository.findCampus();
      if (campus && campus.latitude && campus.longitude) {
        // Simple Haversine distance formula approximation
        const deg2rad = (deg: number) => deg * (Math.PI / 180);
        const R = 6371; // Earth radius in km
        const dLat = deg2rad(campus.latitude - dto.latitude);
        const dLon = deg2rad(campus.longitude - dto.longitude);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(dto.latitude)) *
            Math.cos(deg2rad(campus.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        if (distanceKm > 0.1) {
          // 100 meters
          throw new UnauthorizedException(
            'GPS verification failed: You are not within the 100m radius of the campus.',
          );
        }
      }
    }

    const record = await this.attendanceRepository.create({
      enrollmentId: dto.enrollmentId || null,
      staffId: dto.staffId || null,
      date: dto.date,
      status: dto.status,
      faceVerified: dto.faceVerified || false,
      location: dto.location || null,
      createdBy: 'SYSTEM',
      campusId: recordCampusId,
    });

    if (record.status === 'Absent' && record.enrollment?.studentId) {
      this.commService
        .sendAbsenceAlert(record.enrollment.studentId, record.date)
        .catch(console.error);
    }

    return record;
  }

  async getAttendance(
    tenantContext: TenantContext,
    date?: string,
    month?: string,
  ) {
    const where: any = {};
    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: month };
    }

    return this.attendanceRepository.findMany(where, tenantContext);
  }

  // Campus Isolation Phase 3, Milestone 7 — updateAttendance/deleteAttendance
  // were fully unfiltered for every caller before this fix (singular
  // Prisma update/delete aren't covered by the legacy middleware at all).
  private async assertAttendanceAccessible(
    id: string,
    tenantContext: TenantContext,
  ) {
    const record = await this.attendanceRepository.findById(id);
    if (!record) {
      throw new NotFoundException('Attendance record not found.');
    }
    if (
      !tenantContext.canAccessAllCampuses &&
      record.campusId !== tenantContext.campusId
    ) {
      throw new NotFoundException('Attendance record not found.');
    }
  }

  async updateAttendance(
    id: string,
    dto: UpdateAttendanceDto,
    tenantContext: TenantContext,
  ) {
    await this.assertAttendanceAccessible(id, tenantContext);
    const record = await this.attendanceRepository.update(id, {
      status: dto.status,
    });
    if (record.status === 'Absent' && record.enrollment?.studentId) {
      this.commService
        .sendAbsenceAlert(record.enrollment.studentId, record.date)
        .catch(console.error);
    }
    return record;
  }

  async deleteAttendance(id: string, tenantContext: TenantContext) {
    await this.assertAttendanceAccessible(id, tenantContext);
    return this.attendanceRepository.delete(id);
  }

  async getAttendanceSummary(sectionId: string, tenantContext: TenantContext) {
    const grouped = await this.attendanceRepository.summaryBySection(
      sectionId,
      tenantContext,
    );
    const summary: Record<string, number> = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Leave: 0,
    };
    let total = 0;
    for (const row of grouped) {
      summary[row.status] = row._count._all;
      total += row._count._all;
    }
    return { sectionId, total, byStatus: summary };
  }
}
