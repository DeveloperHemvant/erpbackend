import { ApiProperty } from '@nestjs/swagger';

/** Refresh: 60s (matches the endpoint's @CacheTTL). See KPI_DEFINITIONS.md §1 for
 * the formula and threshold behind every field. */
export class DashboardSummaryDto {
  @ApiProperty({ example: 92, description: 'Student attendance %, today only' })
  attendanceRate: number;

  @ApiProperty({ example: 4610 })
  studentsPresent: number;

  @ApiProperty({ example: 401 })
  studentsAbsent: number;

  @ApiProperty({ example: 97, description: 'Staff attendance %, today only' })
  staffAttendanceRate: number;

  @ApiProperty({ example: 118 })
  staffPresent: number;

  @ApiProperty({ example: 4 })
  staffAbsent: number;

  @ApiProperty({ example: 3, description: 'StudentGateLog LATE_ENTRY rows today' })
  lateEntries: number;

  @ApiProperty({ example: 6, description: 'VisitorRecord rows currently CheckedIn' })
  currentVisitors: number;

  @ApiProperty({ example: 2, description: 'VisitorRecord rows with hostConfirmation=PENDING' })
  pendingVisitorApprovals: number;

  @ApiProperty({ example: 184500, description: 'Sum of FeePayment.amountPaid where paymentDate=today' })
  todaysRevenue: number;

  @ApiProperty({ example: 11, description: 'TransportTrip rows today with status=In Progress' })
  busesRunning: number;

  @ApiProperty({ example: 12, description: 'TransportVehicle rows with status=Active' })
  busesTotal: number;

  @ApiProperty({ example: 1, description: 'Open/unresolved TransportBreakdown rows' })
  transportBreakdownsOpen: number;

  @ApiProperty({ example: 5 })
  pendingLeaveApprovals: number;

  @ApiProperty({ example: 2, description: 'FeeRefund rows with status=Requested' })
  pendingFeeApprovals: number;

  @ApiProperty({ example: 9, description: 'AdmissionInquiry rows not Converted/Lost' })
  pendingAdmissions: number;

  @ApiProperty({ example: 3, description: 'DisciplineIncident rows with status=Open' })
  disciplineOpenCases: number;

  @ApiProperty({ example: 9245000, description: 'All-time collected revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 1830000, description: 'All-time outstanding across all invoices' })
  totalOutstanding: number;

  @ApiProperty({ example: 214 })
  staffCount: number;

  @ApiProperty({ example: 5011 })
  studentCount: number;
}

export class DashboardTrendPointDto {
  @ApiProperty({ example: '08-06' })
  date: string;

  @ApiProperty({ example: 92 })
  rate: number;
}

export class RevenueByClassDto {
  @ApiProperty({ example: 'Grade 10' })
  name: string;

  @ApiProperty({ example: 412000 })
  collected: number;

  @ApiProperty({ example: 88000 })
  outstanding: number;
}

/** Refresh: 5 min (report/trend-tier, not a live counter). */
export class DashboardTrendsDto {
  @ApiProperty({ type: [RevenueByClassDto] })
  revenueByClass: RevenueByClassDto[];

  @ApiProperty({ type: [DashboardTrendPointDto] })
  attendanceTrend: DashboardTrendPointDto[];
}

export class HealthScoreCategoriesDto {
  @ApiProperty({ example: null, nullable: true, description: 'Not yet measurable — no verified aggregation exists (see RC1_IMPLEMENTATION_PLAN.md)' })
  academics: number | null;

  @ApiProperty({ example: 92, nullable: true })
  attendance: number | null;

  @ApiProperty({ example: 88, nullable: true })
  finance: number | null;

  @ApiProperty({ example: 92, nullable: true })
  transport: number | null;

  @ApiProperty({ example: 97, nullable: true })
  discipline: number | null;

  @ApiProperty({ example: null, nullable: true, description: 'Not yet measurable' })
  parentEngagement: number | null;

  @ApiProperty({ example: null, nullable: true, description: 'Not yet measurable' })
  infrastructure: number | null;
}

export class HealthScoreCoverageDto {
  @ApiProperty({ example: 4 })
  measurable: number;

  @ApiProperty({ example: 7 })
  total: number;

  @ApiProperty({ example: '4 of 7 categories measurable' })
  label: string;
}

/** Refresh: 5 min. Weights are fixed and never redistributed onto measurable
 * categories — `score` is capped by `maxPossibleScore` until every category
 * is measurable. See RC1_IMPLEMENTATION_PLAN.md "Operational Health Score". */
export class HealthScoreDto {
  @ApiProperty({ example: 55, description: 'Weighted score against the fixed 100-point base' })
  score: number;

  @ApiProperty({ example: 55, description: 'Ceiling given current category coverage' })
  maxPossibleScore: number;

  @ApiProperty({ type: HealthScoreCoverageDto })
  coverage: HealthScoreCoverageDto;

  @ApiProperty({ type: HealthScoreCategoriesDto })
  categories: HealthScoreCategoriesDto;

  @ApiProperty({
    example: {
      academics: 25,
      attendance: 20,
      finance: 15,
      transport: 10,
      discipline: 10,
      parentEngagement: 10,
      infrastructure: 10,
    },
  })
  weights: Record<string, number>;
}
