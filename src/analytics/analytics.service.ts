import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { invoiceAmount } from './utils/fee-math';
import type {
  DashboardSummaryDto,
  DashboardTrendsDto,
  HealthScoreDto,
} from './dto/analytics.dto';

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

/** Fixed Operational Health Score weights — see RC1_IMPLEMENTATION_PLAN.md.
 * Never redistribute an unmeasured category's weight onto the others. */
const HEALTH_SCORE_WEIGHTS = {
  academics: 25,
  attendance: 20,
  finance: 15,
  transport: 10,
  discipline: 10,
  parentEngagement: 10,
  infrastructure: 10,
} as const;

type HealthScoreCategory = keyof typeof HEALTH_SCORE_WEIGHTS;

/** PROPOSED default per KPI_DEFINITIONS.md: 15 points off per open discipline
 * case per 1000 enrolled students, floor 0. Configurable, not policy-fixed. */
const DISCIPLINE_PENALTY_PER_CASE_PER_1000 = 15;

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  // ---------------------------------------------------------
  // DASHBOARD SUMMARY — composed from small, independently
  // reusable repository calls rather than inline aggregation.
  // ---------------------------------------------------------
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const today = todayStr();

    const [
      attendance,
      lateEntries,
      currentVisitors,
      pendingVisitorApprovals,
      todaysRevenue,
      busesRunning,
      busesTotal,
      transportBreakdownsOpen,
      pendingLeaveApprovals,
      pendingFeeApprovals,
      pendingAdmissions,
      disciplineOpenCases,
      invoiceTotals,
      staffCount,
      studentCount,
    ] = await Promise.all([
      this.getAttendanceSnapshot(today),
      this.repo.countLateEntries(todayRangeUtc()),
      this.repo.countCurrentVisitors(),
      this.repo.countPendingVisitorApprovals(),
      this.repo.sumFeePaymentsForDate(today),
      this.repo.countActiveTripsToday(today),
      this.repo.countActiveVehicles(),
      this.repo.countOpenBreakdowns(),
      this.repo.countPendingLeaveApplications(),
      this.repo.countRequestedRefunds(),
      this.repo.countPendingAdmissions(),
      this.repo.countOpenDisciplineCases(),
      this.getInvoiceTotals(),
      this.repo.countActiveStaff(),
      this.repo.countEnrolledStudents(),
    ]);

    return {
      // Student-only attendance rate — previously mixed student and staff
      // AttendanceRecord rows into one percentage, which misrepresented both.
      attendanceRate: attendance.studentRate,
      studentsPresent: attendance.studentPresent,
      studentsAbsent: attendance.studentAbsent,
      staffAttendanceRate: attendance.staffRate,
      staffPresent: attendance.staffPresent,
      staffAbsent: attendance.staffAbsent,
      lateEntries,
      currentVisitors,
      pendingVisitorApprovals,
      todaysRevenue,
      busesRunning,
      busesTotal,
      transportBreakdownsOpen,
      pendingLeaveApprovals,
      pendingFeeApprovals,
      pendingAdmissions,
      disciplineOpenCases,
      totalRevenue: invoiceTotals.totalCollected,
      totalOutstanding: invoiceTotals.totalOutstanding,
      staffCount,
      studentCount,
    };
  }

  /** Single lean invoice fetch, reused wherever totalInvoiced/Collected/
   * Outstanding is needed (Executive Summary, Health Score's finance
   * sub-score, and FinanceAnalyticsService) so every section of the
   * dashboard derives the same numbers from the same rules. */
  private async getInvoiceTotals(): Promise<{
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
  }> {
    const invoices = await this.repo.findInvoiceFinancials();
    let totalInvoiced = 0;
    let totalCollected = 0;
    for (const inv of invoices) {
      const amt = invoiceAmount(inv);
      totalInvoiced += amt;
      if (inv.status === 'Paid') totalCollected += amt;
    }
    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding: totalInvoiced - totalCollected,
    };
  }

  private async getAttendanceSnapshot(date: string) {
    const [
      studentTotal,
      studentPresent,
      studentAbsent,
      staffTotal,
      staffPresent,
      staffAbsent,
    ] = await Promise.all([
      this.repo.countStudentAttendance(date),
      this.repo.countStudentAttendance(date, 'Present'),
      this.repo.countStudentAttendance(date, 'Absent'),
      this.repo.countStaffAttendance(date),
      this.repo.countStaffAttendance(date, 'Present'),
      this.repo.countStaffAttendance(date, 'Absent'),
    ]);

    return {
      studentRate: studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0,
      studentPresent,
      studentAbsent,
      staffRate: staffTotal > 0 ? Math.round((staffPresent / staffTotal) * 100) : 0,
      staffPresent,
      staffAbsent,
    };
  }

  // ---------------------------------------------------------
  // OPERATIONAL HEALTH SCORE — see RC1_IMPLEMENTATION_PLAN.md and
  // KPI_DEFINITIONS.md. Fixed weights; unmeasured categories score null,
  // never a fabricated number, and are never redistributed onto the rest.
  // ---------------------------------------------------------
  async getHealthScore(): Promise<HealthScoreDto> {
    const today = todayStr();

    const [attendance, transportScore, disciplineScore, financeScore] =
      await Promise.all([
        this.getAttendanceSnapshot(today),
        this.getTransportSubScore(today),
        this.getDisciplineSubScore(),
        this.getFinanceSubScore(),
      ]);

    const categories: Record<HealthScoreCategory, number | null> = {
      academics: null,
      attendance: attendance.studentRate,
      finance: financeScore,
      transport: transportScore,
      discipline: disciplineScore,
      parentEngagement: null,
      infrastructure: null,
    };

    return this.composeHealthScore(categories);
  }

  private composeHealthScore(
    categories: Record<HealthScoreCategory, number | null>,
  ): HealthScoreDto {
    const totalWeight = Object.values(HEALTH_SCORE_WEIGHTS).reduce(
      (a, b) => a + b,
      0,
    );
    let weightedSum = 0;
    let measurableWeight = 0;
    let measurableCount = 0;

    (Object.keys(HEALTH_SCORE_WEIGHTS) as HealthScoreCategory[]).forEach(
      (key) => {
        const score = categories[key];
        if (score != null) {
          weightedSum += HEALTH_SCORE_WEIGHTS[key] * score;
          measurableWeight += HEALTH_SCORE_WEIGHTS[key];
          measurableCount += 1;
        }
      },
    );

    const totalCategories = Object.keys(HEALTH_SCORE_WEIGHTS).length;

    return {
      score: Math.round(weightedSum / totalWeight),
      maxPossibleScore: Math.round((measurableWeight / totalWeight) * 100),
      coverage: {
        measurable: measurableCount,
        total: totalCategories,
        label: `${measurableCount} of ${totalCategories} categories measurable`,
      },
      categories,
      weights: HEALTH_SCORE_WEIGHTS,
    };
  }

  private async getTransportSubScore(today: string): Promise<number | null> {
    const [running, total] = await Promise.all([
      this.repo.countActiveTripsToday(today),
      this.repo.countActiveVehicles(),
    ]);
    if (total === 0) return null;
    return Math.round((running / total) * 100);
  }

  private async getDisciplineSubScore(): Promise<number | null> {
    const [openCases, enrolledCount] = await Promise.all([
      this.repo.countOpenDisciplineCases(),
      this.repo.countEnrolledStudents(),
    ]);
    if (enrolledCount === 0) return null;
    const casesPer1000 = (openCases / enrolledCount) * 1000;
    return Math.max(
      0,
      Math.round(100 - casesPer1000 * DISCIPLINE_PENALTY_PER_CASE_PER_1000),
    );
  }

  private async getFinanceSubScore(): Promise<number | null> {
    const { totalInvoiced, totalCollected } = await this.getInvoiceTotals();
    if (totalInvoiced === 0) return null;
    return Math.round((totalCollected / totalInvoiced) * 100);
  }

  async getTrends(): Promise<DashboardTrendsDto> {
    const classes = await this.repo.findClassRevenueBreakdown();
    const revenueByClass = classes.map((c) => {
      let collected = 0;
      let outstanding = 0;
      c.sections.forEach((sec) => {
        sec.enrollments.forEach((en) => {
          en.invoices.forEach((inv) => {
            if (inv.status === 'Paid') collected += Number(inv.amount);
            else outstanding += Number(inv.amount);
          });
        });
      });
      return { name: c.grade, collected, outstanding };
    });

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const attendanceTrend = await Promise.all(
      days.map(async (dateStr) => {
        const [total, present] = await Promise.all([
          this.repo.countStudentAttendance(dateStr),
          this.repo.countStudentAttendance(dateStr, 'Present'),
        ]);
        return {
          date: dateStr.substring(5),
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      }),
    );

    return { revenueByClass, attendanceTrend };
  }
}
