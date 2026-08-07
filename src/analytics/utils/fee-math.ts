/** Shared invoice/fee math — reused by AnalyticsService (Executive Summary,
 * Operational Health Score) and FinanceAnalyticsService (Finance Dashboard)
 * so both sections derive figures from the exact same rules and never
 * silently disagree with each other. */

export interface InvoiceFinancials {
  amount: unknown;
  totalAmount: unknown;
  status: string;
  dueDate: string;
}

/** `totalAmount` (folds in any applied late fee) wins when present, matching
 * FeesService.getFinancialReports's existing `inv.totalAmount || inv.amount`. */
export function invoiceAmount(inv: InvoiceFinancials): number {
  return Number(inv.totalAmount ?? inv.amount ?? 0);
}

export function isOverdue(inv: InvoiceFinancials, today: string): boolean {
  return inv.status !== 'Paid' && (inv.status === 'Overdue' || inv.dueDate < today);
}

export function daysFromToday(today: string, days: number): string {
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}
