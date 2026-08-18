import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTripDto } from './dto/transport.dto';
import { TransportRepository } from './repositories/transport.repository';
import { TransportOwnershipService } from './transport-ownership.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';
import { assertPendingStatus } from '../common/assert-pending-status.util';

@Injectable()
export class TransportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private transportRepository: TransportRepository,
    private transportOwnership: TransportOwnershipService,
    private readonly renderer: DocumentRenderingService,
    private readonly storage: StorageService,
  ) {}

  // ---------------------------------------------------------
  // VEHICLES
  // ---------------------------------------------------------
  async createVehicle(data: any) {
    return this.prisma.transportVehicle.create({ data });
  }

  async getVehicles() {
    return this.prisma.transportVehicle.findMany({
      include: {
        staff: { include: { staff: true } },
        documents: true,
      },
    });
  }

  async getVehicleProfile(id: string) {
    const vehicle = await this.prisma.transportVehicle.findUnique({
      where: { id },
      include: {
        staff: { include: { staff: true } },
        documents: true,
        TransportTrip: {
          take: 5,
          orderBy: { date: 'desc' },
          include: { route: true, driver: true, logs: true },
        },
        TransportFuelLog: { take: 5, orderBy: { createdAt: 'desc' } },
        TransportService: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { vendor: true },
        },
        TransportTyre: true,
        TransportBattery: true,
        TransportBreakdown: { take: 5, orderBy: { createdAt: 'desc' } },
        TransportAccident: { take: 5, orderBy: { createdAt: 'desc' } },
        TransportExpense: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Calculate total students assigned to this vehicle's trips/routes
    // Find all trips for this vehicle today or generally, and get route -> stops -> students
    const routes = await this.prisma.transportRoute.findMany({
      where: { TransportTrip: { some: { vehicleId: id } } },
      include: {
        stops: {
          include: {
            studentAssignments: { where: { status: 'Active' } },
          },
        },
      },
    });

    let totalStudents = 0;
    routes.forEach((r) => {
      if (r.stops) {
        r.stops.forEach((s: any) => {
          if (s.studentAssignments)
            totalStudents += s.studentAssignments.length;
        });
      }
    });

    return {
      ...vehicle,
      totalStudents,
      assignedRoutes: routes,
      trips: vehicle.TransportTrip,
      fuelLogs: vehicle.TransportFuelLog,
      services: vehicle.TransportService,
      tyres: vehicle.TransportTyre,
      batteries: vehicle.TransportBattery,
      breakdowns: vehicle.TransportBreakdown,
      accidents: vehicle.TransportAccident,
      expenses: vehicle.TransportExpense,
    };
  }

  async updateVehicle(id: string, data: any) {
    return this.prisma.transportVehicle.update({ where: { id }, data });
  }

  async deleteVehicle(id: string) {
    return this.prisma.transportVehicle.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // STAFF ASSIGNMENTS (Drivers & Conductors)
  // ---------------------------------------------------------
  async assignStaffToVehicle(
    vehicleId: string,
    staffId: string,
    shift: string,
  ) {
    return this.prisma.transportVehicleStaff.create({
      data: { vehicleId, staffId, shift },
    });
  }

  async removeStaffFromVehicle(id: string) {
    return this.prisma.transportVehicleStaff.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // ROUTES & STOPS
  // ---------------------------------------------------------
  async createRoute(data: any, user: AuthenticatedUser) {
    if (data.vehicleId) {
      // A driver creating "their" route must supply their own vehicleId.
      await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    } else if (
      !user.permissions.includes('*') &&
      !user.permissions.includes('MANAGE_TRANSPORT_FLEET')
    ) {
      throw new ForbiddenException(
        'Only a transport manager can create a route with no vehicle attached.',
      );
    }
    return this.prisma.transportRoute.create({ data });
  }

  async getRoutes() {
    return this.prisma.transportRoute.findMany({
      include: {
        stops: { orderBy: { orderIndex: 'asc' } },
        vehicle: true,
        _count: { select: { studentAssignments: true } },
      },
    });
  }

  async addStop(routeId: string, data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertRouteAccess(user, routeId);
    return this.prisma.transportRouteStop.create({
      data: { routeId, ...data },
    });
  }

  async removeStop(id: string, user: AuthenticatedUser) {
    await this.transportOwnership.assertStopAccess(user, id);
    return this.prisma.transportRouteStop.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // STUDENT ASSIGNMENTS
  // ---------------------------------------------------------
  async assignStudentToStop(
    enrollmentId: string,
    stopId: string | undefined,
    data: any,
    user: AuthenticatedUser,
  ) {
    // Resolve the target route so we can scope the assignment to a route the
    // caller actually owns — a driver may assign any student school-wide, but
    // only onto a route/stop on their own bus.
    const targetRouteId: string | undefined =
      data.routeId ||
      (stopId
        ? (await this.transportRepository.findStopById(stopId))?.routeId
        : undefined);
    if (!targetRouteId)
      throw new BadRequestException(
        'Either routeId or a valid stopId is required.',
      );
    await this.transportOwnership.assertRouteAccess(user, targetRouteId);

    // Archive previous active assignments
    await this.prisma.transportStudentAssignment.updateMany({
      where: { enrollmentId, status: 'Active' },
      data: { status: 'Archived' },
    });

    return this.prisma.transportStudentAssignment.create({
      data: {
        ...data,
        enrollmentId,
        stopId: stopId || null,
        routeId: targetRouteId,
        status: 'Active',
      },
    });
  }

  async getRouteRoster(routeId: string) {
    return this.prisma.transportStudentAssignment.findMany({
      where: { routeId, status: 'Active' },
      include: {
        enrollment: { include: { student: true } },
        stop: true,
      },
      orderBy: { stop: { orderIndex: 'asc' } },
    });
  }

  async getStudentTransport(enrollmentId: string) {
    return this.prisma.transportStudentAssignment.findFirst({
      where: { enrollmentId, status: 'Active' },
      include: {
        route: {
          include: {
            TransportTrip: {
              take: 1,
              orderBy: { date: 'desc' },
              include: {
                vehicle: {
                  include: {
                    staff: {
                      include: { staff: true },
                    },
                  },
                },
                driver: true,
                logs: { orderBy: { timestamp: 'desc' }, take: 1 },
              },
            },
          },
        },
        stop: {
          include: {
            route: {
              include: {
                TransportTrip: {
                  take: 1,
                  orderBy: { date: 'desc' },
                  include: {
                    vehicle: {
                      include: {
                        staff: {
                          include: { staff: true },
                        },
                      },
                    },
                    driver: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /** Renders on-demand from the student's current active route/stop
   * assignment, same reasoning as ID cards and fee receipts — no separate
   * "bus pass" row to persist, the assignment itself is the source of truth. */
  async renderStudentBusPassPdf(studentId: string): Promise<{ url: string }> {
    const assignment =
      await this.transportRepository.findActiveTransportAssignmentForStudent(
        studentId,
      );
    if (!assignment) {
      throw new NotFoundException(
        'No active transport assignment found for this student',
      );
    }

    const student = assignment.enrollment.student;
    const section = assignment.enrollment.section;
    const className = section
      ? `${section.class?.grade ?? ''} - ${section.name ?? ''}`
      : '';
    const vehicle = assignment.route?.vehicle;
    const vehicleLabel = vehicle
      ? vehicle.busName || vehicle.vehicleNumber
      : 'Unassigned';

    const pdfBuffer = await this.renderer.renderBusPass({
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      className,
      photoUrl: student.photoUrl,
      routeName: assignment.route?.routeName || 'Unassigned',
      stopName: assignment.stop?.stopName || 'Unassigned',
      vehicleLabel,
      pickupTime: assignment.stop?.arrivalTime,
      dropTime: assignment.stop?.departureTime,
    });

    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `bus-passes/${studentId}`,
      `bus-pass-${assignment.id}.pdf`,
      'application/pdf',
    );
    return { url };
  }
  // ---------------------------------------------------------
  // TRIPS & GPS LOGS
  // ---------------------------------------------------------
  async createTrip(data: CreateTripDto, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    return this.prisma.transportTrip.create({ data });
  }

  async getTrips(routeId?: string, date?: string) {
    return this.prisma.transportTrip.findMany({
      where: {
        routeId: routeId || undefined,
        date: date || undefined,
      },
      orderBy: { startTime: 'desc' },
      include: {
        vehicle: true,
        route: true,
        driver: true,
        logs: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
  }

  async updateTrip(id: string, data: any, user: AuthenticatedUser) {
    const trip = await this.prisma.transportTrip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found.');
    await this.transportOwnership.assertVehicleAccess(user, trip.vehicleId);
    return this.prisma.transportTrip.update({
      where: { id },
      data,
    });
  }

  async logTripLocation(tripId: string, data: any) {
    const log = await this.prisma.transportTripLog.create({
      data: { tripId, ...data },
    });

    if (data.status === 'Reached Stop' && data.stopId) {
      this.notifyParentsOfStopArrival(data.stopId).catch((err) =>
        console.error('Failed to notify parents of stop arrival', err),
      );
    }

    return log;
  }

  private async notifyParentsOfStopArrival(stopId: string) {
    const stop = await this.prisma.transportRouteStop.findUnique({
      where: { id: stopId },
    });
    if (!stop) return;

    const assignments = await this.prisma.transportStudentAssignment.findMany({
      where: { stopId, status: 'Active' },
      include: {
        enrollment: { include: { student: { include: { parents: true } } } },
      },
    });

    const parentIds = new Set<string>();
    for (const a of assignments) {
      const student = a.enrollment?.student;
      if (!student) continue;
      for (const ps of student.parents) {
        parentIds.add(ps.parentId);
      }
    }

    if (parentIds.size === 0) return;

    const tokens = await this.notificationsService.getTokensForUsers(
      Array.from(parentIds),
      'PARENT',
    );
    if (tokens.length === 0) return;

    await this.notificationsService.sendPushNotifications(
      tokens,
      'Bus Arrived',
      `The school bus has reached ${stop.stopName}.`,
      { type: 'TRANSPORT_STOP_ARRIVAL', stopId },
    );
  }

  // ---------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------
  async markAttendance(data: any) {
    return this.prisma.transportAttendance.create({ data });
  }

  async getTripAttendance(tripId: string) {
    return this.prisma.transportAttendance.findMany({
      where: { tripId },
      include: { enrollment: { include: { student: true } } },
    });
  }

  // ---------------------------------------------------------
  // FUEL & ODOMETER
  // ---------------------------------------------------------
  async logFuel(data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);

    // Auto-calculate mileage if previous reading exists
    let mileage: number | null = null;
    if (data.previousOdometer && data.currentOdometer && data.litres > 0) {
      mileage = (data.currentOdometer - data.previousOdometer) / data.litres;
    }

    return this.prisma.transportFuelLog.create({
      data: { ...data, mileage },
    });
  }

  async getFuelLogs() {
    return this.prisma.transportFuelLog.findMany({
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveFuelLog(
    id: string,
    dto: { status: string; rejectionReason?: string },
    resolvedBy: string,
  ) {
    const log = await this.transportRepository.findFuelLogById(id);
    if (!log) throw new NotFoundException('Fuel log not found.');
    assertPendingStatus(log.status, 'Pending', 'fuel logs');
    return this.transportRepository.resolveFuelLog(id, {
      status: dto.status,
      approvedBy: resolvedBy,
      rejectionReason:
        dto.status === 'Rejected' ? dto.rejectionReason || null : null,
    });
  }

  async createOdometerLog(data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    return this.transportRepository.createOdometerLog(data);
  }

  async closeOdometerLog(
    id: string,
    data: { closingReading: number; remarks?: string },
  ) {
    const log = await this.transportRepository.findOdometerLogById(id);
    if (!log) throw new NotFoundException('Odometer log not found.');
    const distanceTravelled = data.closingReading - log.openingReading;
    return this.transportRepository.closeOdometerLog(id, {
      closingReading: data.closingReading,
      distanceTravelled,
      remarks: data.remarks,
    });
  }

  async getOdometerLogs(vehicleId?: string, date?: string) {
    return this.transportRepository.getOdometerLogs(vehicleId, date);
  }

  // ---------------------------------------------------------
  // PRE-TRIP DAILY SAFETY CHECK
  // ---------------------------------------------------------
  async createDailyCheck(data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    const booleanFields = [
      'brakesOk',
      'tyresOk',
      'lightsIndicatorsOk',
      'hornOk',
      'firstAidKitOk',
      'fireExtinguisherOk',
      'fuelLevelOk',
    ];
    const anyFailed = booleanFields.some((f) => data[f] === false);
    return this.transportRepository.createDailyCheck({
      ...data,
      overallStatus: anyFailed ? 'Not Fit' : 'Fit',
    });
  }

  async getDailyChecks(vehicleId?: string, date?: string) {
    return this.transportRepository.getDailyChecks(vehicleId, date);
  }

  // ---------------------------------------------------------
  // MAINTENANCE & ASSETS (Phase 2)
  // ---------------------------------------------------------
  async createService(data: any) {
    return this.prisma.transportService.create({ data });
  }

  async getServices() {
    return this.prisma.transportService.findMany({
      include: { vehicle: true, vendor: true },
    });
  }

  async createTyre(data: any) {
    return this.prisma.transportTyre.create({ data });
  }

  async getTyres() {
    return this.prisma.transportTyre.findMany({ include: { vehicle: true } });
  }

  async createBattery(data: any) {
    return this.prisma.transportBattery.create({ data });
  }

  async getBatteries() {
    return this.prisma.transportBattery.findMany({
      include: { vehicle: true },
    });
  }

  // ---------------------------------------------------------
  // INCIDENTS (Accidents, Breakdowns)
  // ---------------------------------------------------------
  async reportBreakdown(data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    return this.prisma.transportBreakdown.create({ data });
  }

  async getBreakdowns() {
    return this.prisma.transportBreakdown.findMany({
      include: { vehicle: true, driver: true },
    });
  }

  async acknowledgeBreakdown(id: string, acknowledgedBy: string) {
    const record = await this.transportRepository.findBreakdownById(id);
    if (!record) throw new NotFoundException('Breakdown report not found.');
    if (record.status !== 'Reported') {
      throw new BadRequestException(
        `Only newly reported breakdowns can be acknowledged (current status: ${record.status}).`,
      );
    }
    return this.transportRepository.acknowledgeBreakdown(id, acknowledgedBy);
  }

  async reportAccident(data: any, user: AuthenticatedUser) {
    await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    return this.prisma.transportAccident.create({ data });
  }

  async getAccidents() {
    return this.prisma.transportAccident.findMany({
      include: { vehicle: true, driver: true },
    });
  }

  async acknowledgeAccident(id: string, acknowledgedBy: string) {
    const record = await this.transportRepository.findAccidentById(id);
    if (!record) throw new NotFoundException('Accident report not found.');
    if (record.status !== 'Under Investigation') {
      throw new BadRequestException(
        `Only accidents under investigation can be acknowledged (current status: ${record.status}).`,
      );
    }
    return this.transportRepository.acknowledgeAccident(id, acknowledgedBy);
  }

  // ---------------------------------------------------------
  // VENDORS & EXPENSES
  // ---------------------------------------------------------
  async createVendor(data: any) {
    return this.prisma.transportVendor.create({ data });
  }

  async getVendors() {
    return this.prisma.transportVendor.findMany();
  }

  async createExpense(data: any, user: AuthenticatedUser) {
    if (data.vehicleId) {
      await this.transportOwnership.assertVehicleAccess(user, data.vehicleId);
    } else if (
      !user.permissions.includes('*') &&
      !user.permissions.includes('MANAGE_TRANSPORT_FLEET')
    ) {
      // School-wide expenses (no vehicleId) aren't tied to any driver's own bus,
      // so only a fleet-wide role may log them.
      throw new ForbiddenException(
        'Only a transport manager can log an expense with no vehicle attached.',
      );
    }
    return this.prisma.transportExpense.create({ data });
  }

  async getExpenses(from?: string, to?: string) {
    return this.prisma.transportExpense.findMany({
      where:
        from || to
          ? { date: { gte: from || undefined, lte: to || undefined } }
          : undefined,
      include: { vehicle: true, vendor: true },
      orderBy: { date: 'desc' },
    });
  }

  async resolveExpense(
    id: string,
    dto: { status: string; rejectionReason?: string },
    resolvedBy: string,
  ) {
    const expense = await this.transportRepository.findExpenseById(id);
    if (!expense) throw new NotFoundException('Expense not found.');
    assertPendingStatus(expense.status, 'Pending', 'expenses');
    return this.transportRepository.resolveExpense(id, {
      status: dto.status,
      approvedBy: resolvedBy,
      rejectionReason:
        dto.status === 'Rejected' ? dto.rejectionReason || null : null,
    });
  }
}
