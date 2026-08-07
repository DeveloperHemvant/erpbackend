import { ApiProperty } from '@nestjs/swagger';

/** Refresh: 60s. Formulas in KPI_DEFINITIONS.md §4. */
export class FinanceSummaryDto {
  @ApiProperty({ example: 174802176, description: 'Σ COALESCE(totalAmount, amount) across all invoices' })
  totalInvoiced: number;

  @ApiProperty({ example: 123219224 })
  totalCollected: number;

  @ApiProperty({ example: 70, description: 'totalCollected / totalInvoiced * 100' })
  collectionRate: number;

  @ApiProperty({ example: 51582952 })
  totalOutstanding: number;

  @ApiProperty({ example: 8120500, description: 'Outstanding invoices past due date or status=Overdue' })
  overdueAmount: number;

  @ApiProperty({ example: 184500, description: "Sum of FeePayment.amountPaid where paymentDate=today" })
  todaysCollection: number;

  @ApiProperty({ example: 12 })
  refundsApprovedCount: number;

  @ApiProperty({ example: 342000, description: 'FeeRefund has no separate "Completed" state beyond Approved — see finance-analytics.service.ts' })
  refundsApprovedAmount: number;

  @ApiProperty({
    type: 'number',
    example: null,
    nullable: true,
    description: 'Not tracked — no Scholarship/discount model or field exists in the schema (see RC1_IMPLEMENTATION_PLAN.md Pending KPIs). Never fabricated.',
  })
  activeScholarshipsDiscounts: number | null;
}

export class CollectionTrendPointDto {
  @ApiProperty({ example: '2026-07' })
  month: string;

  @ApiProperty({ example: 8450000 })
  collected: number;
}

/** Refresh: 5 min. Only months with at least one real payment are returned —
 * no zero-padded fake months to fill a fixed window. */
export class CollectionTrendDto {
  @ApiProperty({ type: [CollectionTrendPointDto] })
  months: CollectionTrendPointDto[];
}

export class OutstandingByGroupDto {
  @ApiProperty({ example: 'Grade 10' })
  name: string;

  @ApiProperty({ example: 214000 })
  outstanding: number;
}

/** Refresh: 5 min. */
export class OutstandingBreakdownDto {
  @ApiProperty({ example: 42000 })
  dueToday: number;

  @ApiProperty({ example: 318000 })
  dueThisWeek: number;

  @ApiProperty({ example: 8120500 })
  overdue: number;

  @ApiProperty({ type: [OutstandingByGroupDto] })
  byClass: OutstandingByGroupDto[];

  @ApiProperty({ type: [OutstandingByGroupDto] })
  bySection: OutstandingByGroupDto[];
}

export class PaymentModeBreakdownItemDto {
  @ApiProperty({ example: 'UPI', description: 'Real FeePayment.paymentMode value — Cash, UPI, NetBanking, Cheque, Stripe, or Razorpay' })
  mode: string;

  @ApiProperty({ example: 412 })
  count: number;

  @ApiProperty({ example: 5124000 })
  amount: number;
}

/** Refresh: 5 min. */
export class PaymentModeBreakdownDto {
  @ApiProperty({ type: [PaymentModeBreakdownItemDto] })
  modes: PaymentModeBreakdownItemDto[];
}

export class RefundBucketDto {
  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ example: 84000 })
  amount: number;
}

/** Refresh: 60s. FeeRefund.status only has Requested/Approved/Rejected — there
 * is no distinct "Completed" state in the schema; `approved` below is the
 * closest real equivalent to a "processed" refund. */
export class RefundDashboardDto {
  @ApiProperty({ type: RefundBucketDto })
  pending: RefundBucketDto;

  @ApiProperty({ type: RefundBucketDto })
  approved: RefundBucketDto;

  @ApiProperty({ type: RefundBucketDto })
  rejected: RefundBucketDto;
}

export class RecentPaymentDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Aarav Sharma' }) studentName: string;
  @ApiProperty({ example: 12000 }) amount: number;
  @ApiProperty({ example: 'UPI' }) mode: string;
  @ApiProperty({ example: '2026-08-07' }) date: string;
}

export class RecentInvoiceDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Aarav Sharma' }) studentName: string;
  @ApiProperty({ example: 15000 }) amount: number;
  @ApiProperty({ example: 'Unpaid' }) status: string;
  @ApiProperty({ example: '2026-08-15' }) dueDate: string;
}

export class RecentRefundDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Aarav Sharma' }) studentName: string;
  @ApiProperty({ example: 3000 }) amount: number;
  @ApiProperty({ example: 'Requested' }) status: string;
  @ApiProperty() requestedAt: string;
}

/** Refresh: 60s. */
export class RecentTransactionsDto {
  @ApiProperty({ type: [RecentPaymentDto] })
  payments: RecentPaymentDto[];

  @ApiProperty({ type: [RecentInvoiceDto] })
  invoices: RecentInvoiceDto[];

  @ApiProperty({ type: [RecentRefundDto] })
  refunds: RecentRefundDto[];
}
