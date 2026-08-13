import { Test, TestingModule } from '@nestjs/testing';
import { FinanceAnalyticsService } from './finance-analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import type { TenantContext } from '../prisma/tenant-context';

describe('FinanceAnalyticsService', () => {
  let service: FinanceAnalyticsService;

  const unrestrictedTenant: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  const mockRepo = {
    findInvoiceFinancials: jest.fn(),
    findPaymentFinancials: jest.fn(),
    findRefundFinancials: jest.fn(),
    findClassRevenueBreakdown: jest.fn(),
    findRecentPayments: jest.fn(),
    findRecentInvoices: jest.fn(),
    findRecentRefunds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceAnalyticsService,
        { provide: AnalyticsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FinanceAnalyticsService>(FinanceAnalyticsService);
  });

  const TODAY = new Date().toISOString().split('T')[0];

  describe('getFinanceSummary', () => {
    it('computes totalInvoiced/Collected/Outstanding/collectionRate correctly', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 100000, totalAmount: null, status: 'Paid', dueDate: '2026-01-01' },
        { amount: 50000, totalAmount: null, status: 'Unpaid', dueDate: '2099-01-01' },
      ]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);

      expect(result.totalInvoiced).toBe(150000);
      expect(result.totalCollected).toBe(100000);
      expect(result.totalOutstanding).toBe(50000);
      expect(result.collectionRate).toBe(67); // round(100000/150000*100)
    });

    it('prefers totalAmount (late fees) over amount when both are present', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 1000, totalAmount: 1200, status: 'Unpaid', dueDate: '2099-01-01' },
      ]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.totalInvoiced).toBe(1200);
    });

    it('sums overdueAmount for status=Overdue or a past dueDate, excluding Paid invoices', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 5000, totalAmount: null, status: 'Overdue', dueDate: '2020-01-01' },
        { amount: 3000, totalAmount: null, status: 'Unpaid', dueDate: '2020-01-01' }, // past due, not yet flagged Overdue
        { amount: 2000, totalAmount: null, status: 'Unpaid', dueDate: '2099-01-01' }, // future due
        { amount: 9000, totalAmount: null, status: 'Paid', dueDate: '2020-01-01' }, // paid, never overdue
      ]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.overdueAmount).toBe(8000); // 5000 + 3000
    });

    it("sums todaysCollection from payments dated today only", async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findPaymentFinancials.mockResolvedValue([
        { amountPaid: 1000, paymentDate: TODAY, paymentMode: 'Cash' },
        { amountPaid: 2000, paymentDate: TODAY, paymentMode: 'UPI' },
        { amountPaid: 5000, paymentDate: '2020-01-01', paymentMode: 'Cash' },
      ]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.todaysCollection).toBe(3000);
    });

    it('counts only Approved refunds as refundsApproved — Requested/Rejected are excluded', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([
        { amount: 1000, status: 'Approved' },
        { amount: 2000, status: 'Approved' },
        { amount: 500, status: 'Requested' },
        { amount: 300, status: 'Rejected' },
      ]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.refundsApprovedCount).toBe(2);
      expect(result.refundsApprovedAmount).toBe(3000);
    });

    it('reports activeScholarshipsDiscounts as null — never fabricated, no backing schema field', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.activeScholarshipsDiscounts).toBeNull();
    });

    it('returns 0% collection rather than dividing by zero on an empty invoice set', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);

      const result = await service.getFinanceSummary(unrestrictedTenant);
      expect(result.collectionRate).toBe(0);
      expect(result.totalInvoiced).toBe(0);
      expect(result.totalOutstanding).toBe(0);
    });
  });

  describe('getCollectionTrend', () => {
    it('buckets payments by month and sorts ascending', async () => {
      mockRepo.findPaymentFinancials.mockResolvedValue([
        { amountPaid: 1000, paymentDate: '2026-06-15', paymentMode: 'Cash' },
        { amountPaid: 2000, paymentDate: '2026-06-20', paymentMode: 'UPI' },
        { amountPaid: 500, paymentDate: '2026-05-01', paymentMode: 'Cash' },
      ]);

      const result = await service.getCollectionTrend(unrestrictedTenant);

      expect(result.months).toEqual([
        { month: '2026-05', collected: 500 },
        { month: '2026-06', collected: 3000 },
      ]);
    });

    it('returns only the months that actually have data — no zero-padded fake months', async () => {
      mockRepo.findPaymentFinancials.mockResolvedValue([
        { amountPaid: 1000, paymentDate: '2026-06-15', paymentMode: 'Cash' },
      ]);

      const result = await service.getCollectionTrend(unrestrictedTenant);
      expect(result.months).toHaveLength(1);
    });

    it('returns an empty list rather than throwing on an empty dataset', async () => {
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      const result = await service.getCollectionTrend(unrestrictedTenant);
      expect(result.months).toEqual([]);
    });

    it('caps at the last 12 real months when more exist', async () => {
      // 15 distinct months across two years, so 3 of them should be dropped.
      const distinctMonths = Array.from({ length: 15 }, (_, i) => {
        const year = 2025 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        return `${year}-${String(month).padStart(2, '0')}`;
      });
      mockRepo.findPaymentFinancials.mockResolvedValue(
        distinctMonths.map((m) => ({ amountPaid: 100, paymentDate: `${m}-01`, paymentMode: 'Cash' })),
      );

      const result = await service.getCollectionTrend(unrestrictedTenant);
      expect(result.months).toHaveLength(12);
      // the most recent 12 should be kept, i.e. the earliest 3 dropped
      expect(result.months[0].month).toBe(distinctMonths[3]);
      expect(result.months[11].month).toBe(distinctMonths[14]);
    });
  });

  describe('getOutstandingBreakdown', () => {
    it('buckets Due Today / Due This Week / Overdue mutually exclusively', async () => {
      const weekAhead = new Date();
      weekAhead.setUTCDate(weekAhead.getUTCDate() + 3);
      const soon = weekAhead.toISOString().split('T')[0];

      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 1000, totalAmount: null, status: 'Unpaid', dueDate: TODAY },
        { amount: 2000, totalAmount: null, status: 'Unpaid', dueDate: soon },
        { amount: 3000, totalAmount: null, status: 'Overdue', dueDate: '2020-01-01' },
        { amount: 4000, totalAmount: null, status: 'Paid', dueDate: TODAY }, // excluded, already paid
      ]);
      mockRepo.findClassRevenueBreakdown.mockResolvedValue([]);

      const result = await service.getOutstandingBreakdown(unrestrictedTenant);

      expect(result.dueToday).toBe(1000);
      expect(result.dueThisWeek).toBe(2000);
      expect(result.overdue).toBe(3000);
    });

    it('aggregates outstanding by class and by section from the same traversal', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findClassRevenueBreakdown.mockResolvedValue([
        {
          grade: 'Grade 5',
          sections: [
            {
              name: 'Section A',
              enrollments: [
                { invoices: [{ amount: 1000, totalAmount: null, status: 'Unpaid', dueDate: '2099-01-01' }] },
              ],
            },
            {
              name: 'Section B',
              enrollments: [
                { invoices: [{ amount: 500, totalAmount: null, status: 'Paid', dueDate: '2099-01-01' }] },
              ],
            },
          ],
        },
      ]);

      const result = await service.getOutstandingBreakdown(unrestrictedTenant);

      expect(result.byClass).toEqual([{ name: 'Grade 5', outstanding: 1000 }]);
      expect(result.bySection).toEqual([{ name: 'Grade 5 — Section A', outstanding: 1000 }]);
    });

    it('returns all zeros/empty arrays rather than throwing on an empty dataset', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findClassRevenueBreakdown.mockResolvedValue([]);

      const result = await service.getOutstandingBreakdown(unrestrictedTenant);
      expect(result).toEqual({ dueToday: 0, dueThisWeek: 0, overdue: 0, byClass: [], bySection: [] });
    });
  });

  describe('getPaymentModeBreakdown', () => {
    it('groups by the real paymentMode values, sorted by amount descending', async () => {
      mockRepo.findPaymentFinancials.mockResolvedValue([
        { amountPaid: 1000, paymentDate: TODAY, paymentMode: 'Cash' },
        { amountPaid: 5000, paymentDate: TODAY, paymentMode: 'UPI' },
        { amountPaid: 2000, paymentDate: TODAY, paymentMode: 'UPI' },
      ]);

      const result = await service.getPaymentModeBreakdown(unrestrictedTenant);

      expect(result.modes).toEqual([
        { mode: 'UPI', count: 2, amount: 7000 },
        { mode: 'Cash', count: 1, amount: 1000 },
      ]);
    });
  });

  describe('getRefundDashboard', () => {
    it('buckets refunds into exactly the 3 real schema states', async () => {
      mockRepo.findRefundFinancials.mockResolvedValue([
        { amount: 100, status: 'Requested' },
        { amount: 200, status: 'Requested' },
        { amount: 300, status: 'Approved' },
        { amount: 400, status: 'Rejected' },
      ]);

      const result = await service.getRefundDashboard(unrestrictedTenant);

      expect(result.pending).toEqual({ count: 2, amount: 300 });
      expect(result.approved).toEqual({ count: 1, amount: 300 });
      expect(result.rejected).toEqual({ count: 1, amount: 400 });
    });

    it('returns zeroed buckets rather than throwing on an empty dataset', async () => {
      mockRepo.findRefundFinancials.mockResolvedValue([]);
      const result = await service.getRefundDashboard(unrestrictedTenant);
      expect(result.pending).toEqual({ count: 0, amount: 0 });
      expect(result.approved).toEqual({ count: 0, amount: 0 });
      expect(result.rejected).toEqual({ count: 0, amount: 0 });
    });
  });

  describe('getRecentTransactions', () => {
    it('reshapes recent payments/invoices/refunds into flat display rows', async () => {
      mockRepo.findRecentPayments.mockResolvedValue([
        {
          id: 'p1',
          amountPaid: 1000,
          paymentMode: 'Cash',
          paymentDate: TODAY,
          invoice: { enrollment: { student: { fullName: 'Aarav Sharma' } } },
        },
      ]);
      mockRepo.findRecentInvoices.mockResolvedValue([
        {
          id: 'i1',
          amount: 2000,
          totalAmount: null,
          status: 'Unpaid',
          dueDate: '2026-09-01',
          enrollment: { student: { fullName: 'Diya Patel' } },
        },
      ]);
      mockRepo.findRecentRefunds.mockResolvedValue([
        {
          id: 'r1',
          amount: 300,
          status: 'Requested',
          reason: 'Overpayment',
          requestedAt: new Date('2026-08-01T00:00:00.000Z'),
          payment: { invoice: { enrollment: { student: { fullName: 'Kabir Singh' } } } },
        },
      ]);

      const result = await service.getRecentTransactions(unrestrictedTenant);

      expect(result.payments[0]).toEqual({ id: 'p1', studentName: 'Aarav Sharma', amount: 1000, mode: 'Cash', date: TODAY });
      expect(result.invoices[0]).toEqual({ id: 'i1', studentName: 'Diya Patel', amount: 2000, status: 'Unpaid', dueDate: '2026-09-01' });
      expect(result.refunds[0]).toEqual({
        id: 'r1',
        studentName: 'Kabir Singh',
        amount: 300,
        status: 'Requested',
        requestedAt: '2026-08-01T00:00:00.000Z',
      });
    });

    it('falls back to "Unknown" rather than throwing when a relation is missing', async () => {
      mockRepo.findRecentPayments.mockResolvedValue([
        { id: 'p1', amountPaid: 1000, paymentMode: 'Cash', paymentDate: TODAY, invoice: null },
      ]);
      mockRepo.findRecentInvoices.mockResolvedValue([]);
      mockRepo.findRecentRefunds.mockResolvedValue([]);

      const result = await service.getRecentTransactions(unrestrictedTenant);
      expect(result.payments[0].studentName).toBe('Unknown');
    });
  });

  describe('Campus Isolation Phase 3 — tenantContext threading', () => {
    const restrictedTenant: TenantContext = {
      userId: 'staff-1',
      role: 'Teacher',
      permissions: ['MANAGE_FEES'],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    };

    beforeEach(() => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.findPaymentFinancials.mockResolvedValue([]);
      mockRepo.findRefundFinancials.mockResolvedValue([]);
      mockRepo.findClassRevenueBreakdown.mockResolvedValue([]);
      mockRepo.findRecentPayments.mockResolvedValue([]);
      mockRepo.findRecentInvoices.mockResolvedValue([]);
      mockRepo.findRecentRefunds.mockResolvedValue([]);
    });

    it('every public method passes tenantContext straight through to the repository', async () => {
      await service.getFinanceSummary(restrictedTenant);
      expect(mockRepo.findInvoiceFinancials).toHaveBeenCalledWith(restrictedTenant);
      expect(mockRepo.findPaymentFinancials).toHaveBeenCalledWith(restrictedTenant);
      expect(mockRepo.findRefundFinancials).toHaveBeenCalledWith(restrictedTenant);

      await service.getCollectionTrend(restrictedTenant);
      expect(mockRepo.findPaymentFinancials).toHaveBeenCalledWith(restrictedTenant);

      await service.getOutstandingBreakdown(restrictedTenant);
      expect(mockRepo.findClassRevenueBreakdown).toHaveBeenCalledWith(restrictedTenant);

      await service.getRecentTransactions(restrictedTenant);
      expect(mockRepo.findRecentPayments).toHaveBeenCalledWith(5, restrictedTenant);
      expect(mockRepo.findRecentInvoices).toHaveBeenCalledWith(5, restrictedTenant);
      expect(mockRepo.findRecentRefunds).toHaveBeenCalledWith(5, restrictedTenant);
    });
  });
});
