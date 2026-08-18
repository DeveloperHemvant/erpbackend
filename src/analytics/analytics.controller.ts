import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { FinanceAnalyticsService } from './finance-analytics.service';
import { AcademicAnalyticsService } from './academic-analytics.service';
import { OperationsAnalyticsService } from './operations-analytics.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantContextInterceptor } from '../prisma/tenant-context.interceptor';
import { TenantAwareCacheInterceptor } from './tenant-aware-cache.interceptor';
import type { TenantContext } from '../prisma/tenant-context';
import {
  DashboardSummaryDto,
  DashboardTrendsDto,
  HealthScoreDto,
} from './dto/analytics.dto';
import {
  FinanceSummaryDto,
  CollectionTrendDto,
  OutstandingBreakdownDto,
  PaymentModeBreakdownDto,
  RefundDashboardDto,
  RecentTransactionsDto,
} from './dto/finance-analytics.dto';
import {
  ExamCompletionDto,
  TeacherWorkloadDto,
  PromotionReadinessDto,
} from './dto/academic-analytics.dto';
import {
  FleetStatusDto,
  FuelUsageDto,
  DisciplineBreakdownDto,
  HostelOccupancyDto,
  GatePassesDto,
  MedicalRoomDto,
} from './dto/operations-analytics.dto';

// Campus Isolation Phase 3, Milestone 2 — the class-level
// @UseInterceptors(CacheInterceptor) that used to sit here is gone
// deliberately, not an oversight. Nest interceptors stack (class-level
// runs outermost); if the plain CacheInterceptor stayed at class level, it
// would still short-circuit on a cache hit — returning the cached value
// directly, never even calling next.handle() — before a method-level
// TenantAwareCacheInterceptor ever got a chance to run, silently
// defeating the fix. So every route below declares its own interceptor
// list explicitly: the 9 finance-related routes (already campus-scoped
// this milestone) use [TenantContextInterceptor, TenantAwareCacheInterceptor]
// in that order (tenant context must be populated before the cache-key
// lookup reads it); the other 9 (Academic/Operations, not yet campus-scoped)
// keep plain CacheInterceptor — still correct, since they return the same
// school-wide answer to every caller today. Future milestones flip a
// route's pair as its data gets campus-scoped, one at a time.
@ApiTags('Analytics')
@Controller('analytics')
@RequirePermissions('VIEW_REPORTS')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly financeAnalyticsService: FinanceAnalyticsService,
    private readonly academicAnalyticsService: AcademicAnalyticsService,
    private readonly operationsAnalyticsService: OperationsAnalyticsService,
  ) {}

  @Get('dashboard/summary')
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_summary')
  @CacheTTL(60000) // 1 minute — see KPI_DEFINITIONS.md "daily counters" tier
  @ApiOperation({
    summary: 'Unified Executive Summary metrics. Client should poll at 60s.',
  })
  @ApiOkResponse({ type: DashboardSummaryDto })
  async getDashboardSummary(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<DashboardSummaryDto> {
    return this.analyticsService.getDashboardSummary(tenantContext);
  }

  @Get('dashboard/trends')
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_trends')
  @CacheTTL(300000) // 5 minutes — "trends/reports" tier, not a live counter
  @ApiOperation({
    summary: 'Trend data for charts. Client should poll at 5 min or on section expand.',
  })
  @ApiOkResponse({ type: DashboardTrendsDto })
  async getTrends(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<DashboardTrendsDto> {
    return this.analyticsService.getTrends(tenantContext);
  }

  @Get('dashboard/health-score')
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_health_score')
  @CacheTTL(300000) // 5 minutes — composite of report-tier categories
  @ApiOperation({
    summary:
      'Operational Health Score — fixed-weight composite, unmeasured categories are null (never fabricated, never redistributed). Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: HealthScoreDto })
  async getHealthScore(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<HealthScoreDto> {
    return this.analyticsService.getHealthScore(tenantContext);
  }

  // ---------------------------------------------------------
  // FINANCE DASHBOARD — same MANAGE_FEES-or-VIEW_REPORTS access rule
  // already used by /erp-core/fees/reports/financial, not the blanket
  // VIEW_REPORTS the rest of this controller uses.
  // ---------------------------------------------------------

  @Get('dashboard/finance/summary')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_summary')
  @CacheTTL(60000)
  @ApiOperation({
    summary: 'Executive Finance Summary. Client should poll at 60s.',
  })
  @ApiOkResponse({ type: FinanceSummaryDto })
  async getFinanceSummary(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<FinanceSummaryDto> {
    return this.financeAnalyticsService.getFinanceSummary(tenantContext);
  }

  @Get('dashboard/finance/collection-trend')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_collection_trend')
  @CacheTTL(300000)
  @ApiOperation({
    summary:
      'Monthly collection trend — only months with real payment data, no projected/fake months. Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: CollectionTrendDto })
  async getCollectionTrend(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<CollectionTrendDto> {
    return this.financeAnalyticsService.getCollectionTrend(tenantContext);
  }

  @Get('dashboard/finance/outstanding')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_outstanding')
  @CacheTTL(300000)
  @ApiOperation({
    summary: 'Outstanding fees breakdown — due today/this week/overdue, by class, by section. Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: OutstandingBreakdownDto })
  async getOutstandingBreakdown(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<OutstandingBreakdownDto> {
    return this.financeAnalyticsService.getOutstandingBreakdown(tenantContext);
  }

  @Get('dashboard/finance/payment-breakdown')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_payment_breakdown')
  @CacheTTL(300000)
  @ApiOperation({
    summary:
      'Payment split by real FeePayment.paymentMode values (Cash/UPI/NetBanking/Cheque/Stripe/Razorpay). Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: PaymentModeBreakdownDto })
  async getPaymentModeBreakdown(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<PaymentModeBreakdownDto> {
    return this.financeAnalyticsService.getPaymentModeBreakdown(tenantContext);
  }

  @Get('dashboard/finance/refunds')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_refunds')
  @CacheTTL(60000)
  @ApiOperation({
    summary: 'Refund dashboard — Pending/Approved/Rejected (the only 3 states FeeRefund tracks). Client should poll at 60s.',
  })
  @ApiOkResponse({ type: RefundDashboardDto })
  async getRefundDashboard(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<RefundDashboardDto> {
    return this.financeAnalyticsService.getRefundDashboard(tenantContext);
  }

  @Get('dashboard/finance/recent-transactions')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_finance_recent_transactions')
  @CacheTTL(60000)
  @ApiOperation({
    summary: 'Latest 5 payments, invoices, and refunds. Client should poll at 60s.',
  })
  @ApiOkResponse({ type: RecentTransactionsDto })
  async getRecentTransactions(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<RecentTransactionsDto> {
    return this.financeAnalyticsService.getRecentTransactions(tenantContext);
  }

  // ---------------------------------------------------------
  // ACADEMIC DASHBOARD — class-level VIEW_REPORTS is sufficient here,
  // no MANAGE_FEES-style override needed. Campus Isolation Phase 3,
  // Milestone 3 — exam-completion and teacher-workload are campus-scoped
  // this pass (tenant-aware cache pair); promotion-readiness stays on
  // plain CacheInterceptor — it delegates to PromotionsService.preview()
  // in a different module, deferred to that module's own future pass
  // rather than smuggling a second module's fix in here.
  // ---------------------------------------------------------

  @Get('dashboard/academic/exam-completion')
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_academic_exam_completion')
  @CacheTTL(300000)
  @ApiOperation({
    summary:
      '% of exam gradebooks published (EMSGradebook.isPublished) in the active exam session — not "has results," which would count a barely-started gradebook as complete. Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: ExamCompletionDto })
  async getExamCompletion(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<ExamCompletionDto> {
    return this.academicAnalyticsService.getExamCompletion(tenantContext);
  }

  @Get('dashboard/academic/teacher-workload')
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_academic_teacher_workload')
  @CacheTTL(300000)
  @ApiOperation({
    summary: 'Top 10 teachers by weekly hours, active academic session only. Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: TeacherWorkloadDto })
  async getTeacherWorkload(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<TeacherWorkloadDto> {
    return this.academicAnalyticsService.getTeacherWorkload(tenantContext);
  }

  @Get('dashboard/academic/promotion-readiness')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('dashboard_academic_promotion_readiness')
  @CacheTTL(300000)
  @ApiOperation({
    summary:
      'Pass/fail readiness for the active session, reusing PromotionsService.preview() (real, read-only). `available:false` when there is no active session — never a fabricated number. Client should poll at 5 min or on section expand.',
  })
  @ApiOkResponse({ type: PromotionReadinessDto })
  async getPromotionReadiness(): Promise<PromotionReadinessDto> {
    return this.academicAnalyticsService.getPromotionReadiness();
  }

  // ---------------------------------------------------------
  // OPERATIONS DASHBOARD — each route gated by the same permission its
  // source module already requires (or VIEW_REPORTS), not a blanket rule.
  // Not campus-scoped this milestone (separate future pass) — plain
  // CacheInterceptor, unchanged.
  // ---------------------------------------------------------

  // Campus Isolation Phase 3, Milestone 4 — fleet-status/fuel-usage/
  // hostel-occupancy are hidden (empty/zeroed) for campus-restricted staff
  // rather than filtered: Transport has no reliable campus path anywhere,
  // and Hostel/HostelRoom have no campus concept at all. discipline/
  // gate-passes/medical-room ARE filtered, student-side (see the plan for
  // why student-side wins over the reporting/approving/logging staff
  // member's own campus). All 6 now use the tenant-aware cache pair —
  // closes out the analytics module: 17 of 18 routes are explicitly
  // tenant-aware; only promotion-readiness stays on plain CacheInterceptor,
  // deliberately deferred to the promotions module's own future pass.

  @Get('dashboard/operations/fleet-status')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_TRANSPORT', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_fleet_status')
  @CacheTTL(30000)
  @ApiOperation({
    summary:
      'Trip status breakdown today + vehicle status counts. Trip status only — GPS is confirmed manual-ping, never a live map. Client should poll at 30s.',
  })
  @ApiOkResponse({ type: FleetStatusDto })
  async getFleetStatus(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<FleetStatusDto> {
    return this.operationsAnalyticsService.getFleetStatus(tenantContext);
  }

  @Get('dashboard/operations/fuel-usage')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_TRANSPORT', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_fuel_usage')
  @CacheTTL(900000)
  @ApiOperation({
    summary: 'Fuel usage, last 30 days, approved logs only. Client should poll at 15 min.',
  })
  @ApiOkResponse({ type: FuelUsageDto })
  async getFuelUsage(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<FuelUsageDto> {
    return this.operationsAnalyticsService.getFuelUsage(tenantContext);
  }

  @Get('dashboard/operations/discipline')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_DISCIPLINE', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_discipline')
  @CacheTTL(300000)
  @ApiOperation({
    summary: 'Open discipline cases by severity/category, plus the 5 most recent. Client should poll at 5 min.',
  })
  @ApiOkResponse({ type: DisciplineBreakdownDto })
  async getDisciplineBreakdown(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<DisciplineBreakdownDto> {
    return this.operationsAnalyticsService.getDisciplineBreakdown(tenantContext);
  }

  @Get('dashboard/operations/hostel-occupancy')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_HOSTEL', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_hostel_occupancy')
  @CacheTTL(900000)
  @ApiOperation({
    summary: 'Occupancy % fleet-wide and per hostel. Client should poll at 15 min.',
  })
  @ApiOkResponse({ type: HostelOccupancyDto })
  async getHostelOccupancy(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<HostelOccupancyDto> {
    return this.operationsAnalyticsService.getHostelOccupancy(tenantContext);
  }

  @Get('dashboard/operations/gate-passes')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_VISITORS', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_gate_passes')
  @CacheTTL(30000)
  @ApiOperation({
    summary: 'Gate passes issued today + currently-out count. Every pass is issued already-approved (no pending queue exists). Client should poll at 30s.',
  })
  @ApiOkResponse({ type: GatePassesDto })
  async getGatePasses(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<GatePassesDto> {
    return this.operationsAnalyticsService.getGatePasses(tenantContext);
  }

  @Get('dashboard/operations/medical-room')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_HEALTH_RECORDS', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor, TenantAwareCacheInterceptor)
  @CacheKey('dashboard_ops_medical_room')
  @CacheTTL(300000)
  @ApiOperation({
    summary: "Today's visit count + 5 most recent. No severity field exists on HealthVisit — never fabricated. Client should poll at 5 min.",
  })
  @ApiOkResponse({ type: MedicalRoomDto })
  async getMedicalRoom(
    @CurrentTenant() tenantContext: TenantContext,
  ): Promise<MedicalRoomDto> {
    return this.operationsAnalyticsService.getMedicalRoom(tenantContext);
  }
}
