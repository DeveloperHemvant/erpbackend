import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import type {
  FleetStatusDto,
  FuelUsageDto,
  DisciplineBreakdownDto,
  HostelOccupancyDto,
  GatePassesDto,
  MedicalRoomDto,
} from './dto/operations-analytics.dto';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function todayRangeUtc(): { gte: Date; lt: Date } {
  const today = todayStr();
  return {
    gte: new Date(`${today}T00:00:00.000Z`),
    lt: new Date(`${today}T23:59:59.999Z`),
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

function countBy<T>(rows: T[], keyOf: (row: T) => string): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

const FUEL_USAGE_WINDOW_DAYS = 30;
const RECENT_DISCIPLINE_TAKE = 5;
const RECENT_MEDICAL_TAKE = 5;

@Injectable()
export class OperationsAnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async getFleetStatus(): Promise<FleetStatusDto> {
    const today = todayStr();
    const [trips, vehicles, openBreakdowns] = await Promise.all([
      this.repo.findTripStatusesToday(today),
      this.repo.findVehicleStatuses(),
      this.repo.countOpenBreakdowns(),
    ]);

    return {
      tripsToday: countBy(trips, (t) => t.status).map((c) => ({ status: c.label, count: c.count })),
      vehiclesByStatus: countBy(vehicles, (v) => v.status).map((c) => ({ status: c.label, count: c.count })),
      openBreakdowns,
    };
  }

  async getFuelUsage(): Promise<FuelUsageDto> {
    const logs = await this.repo.findApprovedFuelLogs(daysAgo(FUEL_USAGE_WINDOW_DAYS));

    const totalLitres = logs.reduce((s, l) => s + l.litres, 0);
    const totalCost = logs.reduce((s, l) => s + l.totalCost, 0);
    const withMileage = logs.filter((l) => l.mileage != null);
    const avgMileage =
      withMileage.length > 0
        ? Math.round((withMileage.reduce((s, l) => s + (l.mileage ?? 0), 0) / withMileage.length) * 10) / 10
        : null;

    return { totalLitres, totalCost, avgMileage, logCount: logs.length };
  }

  async getDisciplineBreakdown(): Promise<DisciplineBreakdownDto> {
    const [openIncidents, recent] = await Promise.all([
      this.repo.findOpenDisciplineIncidents(),
      this.repo.findRecentDisciplineIncidents(RECENT_DISCIPLINE_TAKE),
    ]);

    return {
      openCount: openIncidents.length,
      bySeverity: countBy(openIncidents, (i) => i.severity),
      byCategory: countBy(openIncidents, (i) => i.category),
      recent: recent.map((r) => ({
        id: r.id,
        studentName: r.student.fullName,
        category: r.category,
        severity: r.severity,
        status: r.status,
        incidentDate: r.incidentDate.toISOString(),
      })),
    };
  }

  async getHostelOccupancy(): Promise<HostelOccupancyDto> {
    const rooms = await this.repo.findHostelRoomsWithActiveAllocations();

    const byHostelMap = new Map<string, { name: string; capacity: number; occupied: number }>();
    for (const room of rooms) {
      const bucket = byHostelMap.get(room.hostel.id) ?? {
        name: room.hostel.name,
        capacity: 0,
        occupied: 0,
      };
      bucket.capacity += room.capacity;
      bucket.occupied += room.allocations.length;
      byHostelMap.set(room.hostel.id, bucket);
    }

    const byHostel = Array.from(byHostelMap.values()).map((h) => ({
      ...h,
      occupancyRate: h.capacity > 0 ? Math.round((h.occupied / h.capacity) * 100) : 0,
    }));

    const totalCapacity = byHostel.reduce((s, h) => s + h.capacity, 0);
    const totalOccupied = byHostel.reduce((s, h) => s + h.occupied, 0);

    return {
      totalCapacity,
      totalOccupied,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      byHostel,
    };
  }

  async getGatePasses(): Promise<GatePassesDto> {
    const passes = await this.repo.findGatePasses(todayRangeUtc());
    const today = todayRangeUtc();

    const issuedToday = passes.filter(
      (p) => p.exitTime >= today.gte && p.exitTime < today.lt,
    ).length;
    const currentlyOut = passes.filter(
      (p) => p.status === 'Approved' && p.returnTime == null,
    ).length;

    return { issuedToday, currentlyOut };
  }

  async getMedicalRoom(): Promise<MedicalRoomDto> {
    const [visitsToday, recent] = await Promise.all([
      this.repo.countMedicalVisitsToday(todayRangeUtc()),
      this.repo.findRecentMedicalVisits(RECENT_MEDICAL_TAKE),
    ]);

    return {
      visitsToday,
      recent: recent.map((v) => ({
        id: v.id,
        studentName: v.student.fullName,
        reason: v.reason,
        actionTaken: v.actionTaken,
        visitDate: v.visitDate.toISOString(),
      })),
    };
  }
}
