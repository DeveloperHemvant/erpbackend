// @ts-nocheck
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CommunicationService } from "../communication/communication.service";
import { AttendanceRepository } from "./repositories/attendance.repository";
import { CreateAttendanceDto } from "./dto/attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly commService: CommunicationService,
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async logAttendance(dto: CreateAttendanceDto & { latitude?: number, longitude?: number }) {
    if (dto.latitude && dto.longitude) {
      const campus = await this.attendanceRepository.findCampus();
      if (campus && campus.latitude && campus.longitude) {
        // Simple Haversine distance formula approximation
        const deg2rad = (deg: number) => deg * (Math.PI / 180);
        const R = 6371; // Earth radius in km
        const dLat = deg2rad(campus.latitude - dto.latitude);
        const dLon = deg2rad(campus.longitude - dto.longitude);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(dto.latitude)) * Math.cos(deg2rad(campus.latitude)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;
        if (distanceKm > 0.1) { // 100 meters
          throw new UnauthorizedException("GPS verification failed: You are not within the 100m radius of the campus.");
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
      createdBy: "SYSTEM",
    });

    if (record.status === "Absent" && record.enrollment?.studentId) {
      this.commService.sendAbsenceAlert(record.enrollment.studentId, record.date).catch(console.error);
    }

    return record;
  }

  async getAttendance(date?: string, month?: string) {
    const where: any = {};
    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: month };
    }

    return this.attendanceRepository.findMany(where);
  }

  async deleteAttendance(id: string) {
    return this.attendanceRepository.delete(id);
  }

  async getAttendanceSummary(sectionId: string) {
    const grouped = await this.attendanceRepository.summaryBySection(sectionId);
    const summary: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    let total = 0;
    for (const row of grouped) {
      summary[row.status] = row._count._all;
      total += row._count._all;
    }
    return { sectionId, total, byStatus: summary };
  }
}
