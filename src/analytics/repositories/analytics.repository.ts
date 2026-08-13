import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { requireCampusId, type TenantContext } from '../../prisma/tenant-context';

/** The one rule every campus-scoped method below follows (Campus Isolation
 * Phase 3, Milestone 2) — never applied when unrestricted (D3). */
function campusFilter(tenantContext: TenantContext): { campusId: string } | {} {
  return tenantContext.canAccessAllCampuses
    ? {}
    : { campusId: requireCampusId(tenantContext) };
}

/**
 * Every raw aggregate query the dashboard needs, as small named methods —
 * no derivation/business math here (percentages, weighting, etc. belong in
 * AnalyticsService). Methods are reused across multiple widgets/endpoints
 * where the same underlying count applies (e.g. countStudentAttendance backs
 * both today's snapshot and the 7-day trend) instead of each caller issuing
 * its own copy of the same query.
 */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  countStudentAttendance(date: string, status?: string) {
    return this.prisma.attendanceRecord.count({
      where: {
        date,
        enrollmentId: { not: null },
        ...(status ? { status } : {}),
      },
    });
  }

  countStaffAttendance(date: string, status?: string) {
    return this.prisma.attendanceRecord.count({
      where: {
        date,
        staffId: { not: null },
        ...(status ? { status } : {}),
      },
    });
  }

  countLateEntries(range: { gte: Date; lt: Date }) {
    return this.prisma.studentGateLog.count({
      where: { type: 'LATE_ENTRY', timestamp: { gte: range.gte, lt: range.lt } },
    });
  }

  countCurrentVisitors() {
    return this.prisma.visitorRecord.count({ where: { status: 'CheckedIn' } });
  }

  countPendingVisitorApprovals() {
    return this.prisma.visitorRecord.count({
      where: { hostConfirmation: 'PENDING' },
    });
  }

  async sumFeePaymentsForDate(
    date: string,
    tenantContext: TenantContext,
  ): Promise<number> {
    const result = await this.prisma.feePayment.aggregate({
      _sum: { amountPaid: true },
      where: {
        paymentDate: date,
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { invoice: { campusId: requireCampusId(tenantContext) } }),
      },
    });
    return Number(result._sum.amountPaid ?? 0);
  }

  countActiveTripsToday(date: string) {
    return this.prisma.transportTrip.count({
      where: { date, status: 'In Progress' },
    });
  }

  countActiveVehicles() {
    return this.prisma.transportVehicle.count({ where: { status: 'Active' } });
  }

  /** Shared by AnalyticsService.getDashboardSummary() (Executive) and
   * OperationsAnalyticsService.getFleetStatus() — TransportBreakdown only
   * has a nullable driver relation, no reliable campus path (same reasoning
   * as findTripStatusesToday above), so this hides to 0 for campus-
   * restricted staff rather than a half-trustworthy count. */
  countOpenBreakdowns(tenantContext: TenantContext) {
    if (!tenantContext.canAccessAllCampuses) return Promise.resolve(0);
    return this.prisma.transportBreakdown.count({
      where: { status: { in: ['Reported', 'Acknowledged', 'Under Repair'] } },
    });
  }

  countPendingLeaveApplications() {
    return this.prisma.leaveApplication.count({ where: { status: 'Pending' } });
  }

  countRequestedRefunds() {
    return this.prisma.feeRefund.count({ where: { status: 'Requested' } });
  }

  countPendingAdmissions() {
    return this.prisma.admissionInquiry.count({
      where: { status: { notIn: ['Converted', 'Lost'] } },
    });
  }

  countOpenDisciplineCases() {
    return this.prisma.disciplineIncident.count({ where: { status: 'Open' } });
  }

  countEnrolledStudents() {
    return this.prisma.studentEnrollment.count({ where: { status: 'Enrolled' } });
  }

  countActiveStaff() {
    return this.prisma.staff.count({ where: { status: 'Active' } });
  }

  /**
   * Lean fetch of every invoice's financial fields — one query backs every
   * invoice-derived figure (Total Invoiced, Collected, Outstanding, Overdue,
   * Due Today/This Week) so callers don't each issue their own aggregate.
   * `totalAmount` (which folds in late fees) is preferred over `amount` when
   * present — this mirrors FeesService.getFinancialReports's existing
   * `inv.totalAmount || inv.amount` logic; an earlier version of this
   * repository summed `amount` only, which under-counted invoices with a
   * late fee applied.
   */
  findInvoiceFinancials(tenantContext: TenantContext) {
    return this.prisma.feeInvoice.findMany({
      where: campusFilter(tenantContext),
      select: { amount: true, totalAmount: true, status: true, dueDate: true },
    });
  }

  /**
   * Lean fetch of every payment's financial fields — backs Today's
   * Collection, Collection Trend (bucketed by month), and Payment Mode
   * Breakdown from a single query instead of three.
   */
  findPaymentFinancials(tenantContext: TenantContext) {
    return this.prisma.feePayment.findMany({
      where: tenantContext.canAccessAllCampuses
        ? {}
        : { invoice: { campusId: requireCampusId(tenantContext) } },
      select: { amountPaid: true, paymentDate: true, paymentMode: true },
    });
  }

  /** Lean fetch backing the Refund Dashboard's Pending/Approved/Rejected split. */
  findRefundFinancials(tenantContext: TenantContext) {
    return this.prisma.feeRefund.findMany({
      where: tenantContext.canAccessAllCampuses
        ? {}
        : {
            payment: {
              invoice: { campusId: requireCampusId(tenantContext) },
            },
          },
      select: { amount: true, status: true },
    });
  }

  findRecentPayments(take: number, tenantContext: TenantContext) {
    return this.prisma.feePayment.findMany({
      take,
      where: tenantContext.canAccessAllCampuses
        ? {}
        : { invoice: { campusId: requireCampusId(tenantContext) } },
      orderBy: { paymentDate: 'desc' },
      select: {
        id: true,
        amountPaid: true,
        paymentMode: true,
        paymentDate: true,
        invoice: {
          select: {
            enrollment: { select: { student: { select: { fullName: true } } } },
          },
        },
      },
    });
  }

  findRecentInvoices(take: number, tenantContext: TenantContext) {
    return this.prisma.feeInvoice.findMany({
      take,
      where: campusFilter(tenantContext),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        enrollment: {
          select: { student: { select: { fullName: true } } },
        },
      },
    });
  }

  findRecentRefunds(take: number, tenantContext: TenantContext) {
    return this.prisma.feeRefund.findMany({
      take,
      where: tenantContext.canAccessAllCampuses
        ? {}
        : {
            payment: {
              invoice: { campusId: requireCampusId(tenantContext) },
            },
          },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        reason: true,
        requestedAt: true,
        payment: {
          select: {
            invoice: {
              select: {
                enrollment: { select: { student: { select: { fullName: true } } } },
              },
            },
          },
        },
      },
    });
  }

  /** Gradebooks belong to `EMSExamSession` (an EMS-specific exam term), not
   * the school's `AcademicSession` — these are two separate session concepts
   * in the schema, don't conflate them. */
  countGradebooks(
    onlyActiveExamSession: boolean,
    onlyPublished: boolean | undefined,
    tenantContext: TenantContext,
  ) {
    return this.prisma.eMSGradebook.count({
      where: {
        ...(onlyActiveExamSession ? { session: { isActive: true } } : {}),
        ...(onlyPublished ? { isPublished: true } : {}),
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { class: { campusId: requireCampusId(tenantContext) } }),
      },
    });
  }

  /** Active-session teaching assignments only, lean-selected — backs the
   * Teacher Workload rollup (grouped by staff in the service layer). */
  findActiveTeacherAssignments(sessionId: string, tenantContext: TenantContext) {
    return this.prisma.teacherAssignment.findMany({
      where: {
        sessionId,
        status: 'Active',
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { staff: { campusId: requireCampusId(tenantContext) } }),
      },
      select: {
        staffId: true,
        hoursPerWeek: true,
        subjectId: true,
        sectionId: true,
        staff: { select: { fullName: true } },
      },
    });
  }

  findClassRevenueBreakdown(tenantContext: TenantContext) {
    return this.prisma.class.findMany({
      where: campusFilter(tenantContext),
      include: {
        sections: { include: { enrollments: { include: { invoices: true } } } },
      },
    });
  }

  /** Today's trips, status only — grouped in the service into the fleet
   * status breakdown (Scheduled/In Progress/Completed/Cancelled).
   * Campus Isolation Phase 3, Milestone 4 — TransportTrip/TransportVehicle
   * have no reliable campus path (TransportVehicle: none at all;
   * TransportTrip: only a nullable driver relation, too weak/optional to
   * filter by, and this method's sibling findVehicleStatuses() has no path
   * regardless) — hidden for campus-restricted staff, matching search's
   * no-path policy, rather than a half-filtered response. */
  findTripStatusesToday(
    date: string,
    tenantContext: TenantContext,
  ): Promise<{ status: string }[]> {
    if (!tenantContext.canAccessAllCampuses) return Promise.resolve([]);
    return this.prisma.transportTrip.findMany({
      where: { date },
      select: { status: true },
    });
  }

  /** All vehicles, status only — grouped in the service (Active/Maintenance/
   * Accident/Retired). No campus path exists on TransportVehicle at all. */
  findVehicleStatuses(
    tenantContext: TenantContext,
  ): Promise<{ status: string }[]> {
    if (!tenantContext.canAccessAllCampuses) return Promise.resolve([]);
    return this.prisma.transportVehicle.findMany({ select: { status: true } });
  }

  /** Approved fuel logs in a date range — `status='Approved'` only, matching
   * "real cost incurred," not logs still pending sign-off. TransportFuelLog
   * has no campus path (filledBy/approvedBy are free-text, not relations). */
  findApprovedFuelLogs(
    sinceDate: string,
    tenantContext: TenantContext,
  ): Promise<{ litres: number; totalCost: number; mileage: number | null }[]> {
    if (!tenantContext.canAccessAllCampuses) return Promise.resolve([]);
    return this.prisma.transportFuelLog.findMany({
      where: { status: 'Approved', date: { gte: sinceDate } },
      select: { litres: true, totalCost: true, mileage: true },
    });
  }

  /** Student-side campus, not the reporting staff member's (D2-adjacent
   * reasoning, see Milestone 4's plan) — a discipline incident belongs to
   * the student it's about, not whoever happened to file the paperwork. */
  findOpenDisciplineIncidents(tenantContext: TenantContext) {
    return this.prisma.disciplineIncident.findMany({
      where: {
        status: 'Open',
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : {
              student: {
                enrollments: { some: { campusId: requireCampusId(tenantContext) } },
              },
            }),
      },
      select: { severity: true, category: true },
    });
  }

  findRecentDisciplineIncidents(take: number, tenantContext: TenantContext) {
    return this.prisma.disciplineIncident.findMany({
      take,
      where: tenantContext.canAccessAllCampuses
        ? {}
        : {
            student: {
              enrollments: { some: { campusId: requireCampusId(tenantContext) } },
            },
          },
      orderBy: { incidentDate: 'desc' },
      select: {
        id: true,
        category: true,
        severity: true,
        status: true,
        incidentDate: true,
        student: { select: { fullName: true } },
      },
    });
  }

  /** Every room with capacity + its currently-active allocation count, plus
   * the owning hostel's name — one query backs both the fleet-wide and
   * per-hostel occupancy figures. Hostel/HostelRoom have no campus concept
   * anywhere in the schema (not even indirectly) — hidden for
   * campus-restricted staff, same reasoning as the Transport methods above. */
  findHostelRoomsWithActiveAllocations(tenantContext: TenantContext): Promise<
    {
      id: string;
      capacity: number;
      hostel: { id: string; name: string };
      allocations: { id: string }[];
    }[]
  > {
    if (!tenantContext.canAccessAllCampuses) return Promise.resolve([]);
    return this.prisma.hostelRoom.findMany({
      select: {
        id: true,
        capacity: true,
        hostel: { select: { id: true, name: true } },
        allocations: { where: { status: 'Active' }, select: { id: true } },
      },
    });
  }

  /** Student-side campus, not the approving staff member's — same reasoning
   * as discipline incidents above. */
  findGatePasses(
    todayRange: { gte: Date; lt: Date },
    tenantContext: TenantContext,
  ) {
    return this.prisma.studentGatePass.findMany({
      select: { status: true, exitTime: true, returnTime: true },
      where: {
        OR: [
          { exitTime: { gte: todayRange.gte, lt: todayRange.lt } },
          { status: 'Approved', returnTime: null },
        ],
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : {
              student: {
                enrollments: { some: { campusId: requireCampusId(tenantContext) } },
              },
            }),
      },
    });
  }

  /** Patient's campus, not the logging nurse/staff member's — same reasoning
   * as discipline incidents/gate passes above. */
  countMedicalVisitsToday(
    range: { gte: Date; lt: Date },
    tenantContext: TenantContext,
  ) {
    return this.prisma.healthVisit.count({
      where: {
        visitDate: { gte: range.gte, lt: range.lt },
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : {
              student: {
                enrollments: { some: { campusId: requireCampusId(tenantContext) } },
              },
            }),
      },
    });
  }

  findRecentMedicalVisits(take: number, tenantContext: TenantContext) {
    return this.prisma.healthVisit.findMany({
      take,
      where: tenantContext.canAccessAllCampuses
        ? {}
        : {
            student: {
              enrollments: { some: { campusId: requireCampusId(tenantContext) } },
            },
          },
      orderBy: { visitDate: 'desc' },
      select: {
        id: true,
        reason: true,
        actionTaken: true,
        visitDate: true,
        student: { select: { fullName: true } },
      },
    });
  }
}
