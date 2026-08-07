import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransportRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Ownership lookups ---
  findVehicleStaffAssignment(staffId: string, vehicleId: string) {
    return this.prisma.transportVehicleStaff.findFirst({
      where: { staffId, vehicleId, status: 'Assigned' },
    });
  }

  findVehicleIdsForStaff(staffId: string) {
    return this.prisma.transportVehicleStaff
      .findMany({
        where: { staffId, status: 'Assigned' },
        select: { vehicleId: true },
      })
      .then((rows) => rows.map((r) => r.vehicleId));
  }

  findRouteById(id: string) {
    return this.prisma.transportRoute.findUnique({ where: { id } });
  }

  findStopById(id: string) {
    return this.prisma.transportRouteStop.findUnique({ where: { id } });
  }

  // --- Odometer logs ---
  createOdometerLog(data: Prisma.TransportOdometerLogUncheckedCreateInput) {
    return this.prisma.transportOdometerLog.create({ data });
  }

  closeOdometerLog(
    id: string,
    data: {
      closingReading: number;
      distanceTravelled?: number;
      remarks?: string;
    },
  ) {
    return this.prisma.transportOdometerLog.update({ where: { id }, data });
  }

  findOdometerLogById(id: string) {
    return this.prisma.transportOdometerLog.findUnique({ where: { id } });
  }

  getOdometerLogs(vehicleId?: string, date?: string) {
    return this.prisma.transportOdometerLog.findMany({
      where: { vehicleId: vehicleId || undefined, date: date || undefined },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
  }

  // --- Daily checks ---
  createDailyCheck(data: Prisma.TransportDailyCheckUncheckedCreateInput) {
    return this.prisma.transportDailyCheck.create({ data });
  }

  getDailyChecks(vehicleId?: string, date?: string) {
    return this.prisma.transportDailyCheck.findMany({
      where: { vehicleId: vehicleId || undefined, date: date || undefined },
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findDailyCheckForVehicleAndDate(vehicleId: string, date: string) {
    return this.prisma.transportDailyCheck.findFirst({
      where: { vehicleId, date },
    });
  }

  // --- Fuel approval ---
  findFuelLogById(id: string) {
    return this.prisma.transportFuelLog.findUnique({ where: { id } });
  }

  resolveFuelLog(
    id: string,
    data: {
      status: string;
      approvedBy: string;
      rejectionReason?: string | null;
    },
  ) {
    return this.prisma.transportFuelLog.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        rejectionReason: data.rejectionReason ?? null,
      },
    });
  }

  // --- Expense approval ---
  findExpenseById(id: string) {
    return this.prisma.transportExpense.findUnique({ where: { id } });
  }

  resolveExpense(
    id: string,
    data: {
      status: string;
      approvedBy: string;
      rejectionReason?: string | null;
    },
  ) {
    return this.prisma.transportExpense.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        rejectionReason: data.rejectionReason ?? null,
      },
    });
  }

  // --- Incident acknowledgment ---
  findBreakdownById(id: string) {
    return this.prisma.transportBreakdown.findUnique({ where: { id } });
  }

  acknowledgeBreakdown(id: string, acknowledgedBy: string) {
    return this.prisma.transportBreakdown.update({
      where: { id },
      data: {
        status: 'Acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });
  }

  findAccidentById(id: string) {
    return this.prisma.transportAccident.findUnique({ where: { id } });
  }

  acknowledgeAccident(id: string, acknowledgedBy: string) {
    return this.prisma.transportAccident.update({
      where: { id },
      data: {
        status: 'Acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });
  }
}
