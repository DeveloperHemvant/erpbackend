import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { invoiceAmount, isOverdue, daysFromToday } from './utils/fee-math';
import type {
  FinanceSummaryDto,
  CollectionTrendDto,
  OutstandingBreakdownDto,
  OutstandingByGroupDto,
  PaymentModeBreakdownDto,
  RefundDashboardDto,
  RecentTransactionsDto,
} from './dto/finance-analytics.dto';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Only the last N months that actually have at least one payment are
 * returned by getCollectionTrend — this constant just caps how many of
 * those real months to keep, it never pads in fake empty ones. */
const COLLECTION_TREND_MAX_MONTHS = 12;

@Injectable()
export class FinanceAnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async getFinanceSummary(): Promise<FinanceSummaryDto> {
    const today = todayStr();
    const [invoices, payments, refunds] = await Promise.all([
      this.repo.findInvoiceFinancials(),
      this.repo.findPaymentFinancials(),
      this.repo.findRefundFinancials(),
    ]);

    let totalInvoiced = 0;
    let totalCollected = 0;
    let overdueAmount = 0;
    for (const inv of invoices) {
      const amt = invoiceAmount(inv);
      totalInvoiced += amt;
      if (inv.status === 'Paid') totalCollected += amt;
      else if (isOverdue(inv, today)) overdueAmount += amt;
    }

    const todaysCollection = payments
      .filter((p) => p.paymentDate === today)
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);

    const approvedRefunds = refunds.filter((r) => r.status === 'Approved');

    return {
      totalInvoiced,
      totalCollected,
      collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
      totalOutstanding: totalInvoiced - totalCollected,
      overdueAmount,
      todaysCollection,
      refundsApprovedCount: approvedRefunds.length,
      refundsApprovedAmount: approvedRefunds.reduce((s, r) => s + Number(r.amount), 0),
      // No Scholarship/discount model or field exists anywhere in the schema
      // (verified against schema.prisma — only a free-text naming convention
      // in FeeStructure.name). Reporting null rather than fabricating a count.
      activeScholarshipsDiscounts: null,
    };
  }

  async getCollectionTrend(): Promise<CollectionTrendDto> {
    const payments = await this.repo.findPaymentFinancials();

    const byMonth = new Map<string, number>();
    for (const p of payments) {
      const month = p.paymentDate.substring(0, 7); // YYYY-MM
      byMonth.set(month, (byMonth.get(month) ?? 0) + Number(p.amountPaid));
    }

    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-COLLECTION_TREND_MAX_MONTHS)
      .map(([month, collected]) => ({ month, collected }));

    return { months };
  }

  async getOutstandingBreakdown(): Promise<OutstandingBreakdownDto> {
    const today = todayStr();
    const weekAhead = daysFromToday(today, 7);

    const [invoices, classBreakdown] = await Promise.all([
      this.repo.findInvoiceFinancials(),
      this.repo.findClassRevenueBreakdown(),
    ]);

    let dueToday = 0;
    let dueThisWeek = 0;
    let overdue = 0;
    for (const inv of invoices) {
      if (inv.status === 'Paid') continue;
      const amt = invoiceAmount(inv);
      if (isOverdue(inv, today)) {
        overdue += amt;
      } else if (inv.dueDate === today) {
        dueToday += amt;
      } else if (inv.dueDate > today && inv.dueDate <= weekAhead) {
        dueThisWeek += amt;
      }
    }

    const byClass: OutstandingByGroupDto[] = [];
    const bySectionMap = new Map<string, number>();

    for (const cls of classBreakdown) {
      let classOutstanding = 0;
      for (const sec of cls.sections) {
        let sectionOutstanding = 0;
        for (const en of sec.enrollments) {
          for (const inv of en.invoices) {
            if (inv.status !== 'Paid') sectionOutstanding += invoiceAmount(inv);
          }
        }
        classOutstanding += sectionOutstanding;
        const sectionLabel = `${cls.grade} — ${sec.name}`;
        bySectionMap.set(sectionLabel, (bySectionMap.get(sectionLabel) ?? 0) + sectionOutstanding);
      }
      if (classOutstanding > 0) byClass.push({ name: cls.grade, outstanding: classOutstanding });
    }

    const bySection = Array.from(bySectionMap.entries())
      .filter(([, outstanding]) => outstanding > 0)
      .map(([name, outstanding]) => ({ name, outstanding }));

    return { dueToday, dueThisWeek, overdue, byClass, bySection };
  }

  async getPaymentModeBreakdown(): Promise<PaymentModeBreakdownDto> {
    const payments = await this.repo.findPaymentFinancials();

    const byMode = new Map<string, { count: number; amount: number }>();
    for (const p of payments) {
      const bucket = byMode.get(p.paymentMode) ?? { count: 0, amount: 0 };
      bucket.count += 1;
      bucket.amount += Number(p.amountPaid);
      byMode.set(p.paymentMode, bucket);
    }

    const modes = Array.from(byMode.entries())
      .map(([mode, v]) => ({ mode, ...v }))
      .sort((a, b) => b.amount - a.amount);

    return { modes };
  }

  async getRefundDashboard(): Promise<RefundDashboardDto> {
    const refunds = await this.repo.findRefundFinancials();

    const bucket = (status: string) => {
      const rows = refunds.filter((r) => r.status === status);
      return { count: rows.length, amount: rows.reduce((s, r) => s + Number(r.amount), 0) };
    };

    return {
      pending: bucket('Requested'),
      approved: bucket('Approved'),
      rejected: bucket('Rejected'),
    };
  }

  async getRecentTransactions(): Promise<RecentTransactionsDto> {
    const TAKE = 5;
    const [payments, invoices, refunds] = await Promise.all([
      this.repo.findRecentPayments(TAKE),
      this.repo.findRecentInvoices(TAKE),
      this.repo.findRecentRefunds(TAKE),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        studentName: p.invoice?.enrollment?.student?.fullName ?? 'Unknown',
        amount: Number(p.amountPaid),
        mode: p.paymentMode,
        date: p.paymentDate,
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        studentName: i.enrollment?.student?.fullName ?? 'Unknown',
        amount: invoiceAmount(i),
        status: i.status,
        dueDate: i.dueDate,
      })),
      refunds: refunds.map((r) => ({
        id: r.id,
        studentName: r.payment?.invoice?.enrollment?.student?.fullName ?? 'Unknown',
        amount: Number(r.amount),
        status: r.status,
        requestedAt: r.requestedAt.toISOString(),
      })),
    };
  }
}
