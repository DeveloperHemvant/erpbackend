import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { FeesService } from './fees.service';
import { CommunicationService } from '../communication/communication.service';
import { StudentRepository } from '../students/repositories/student.repository';
import { FeeRepository } from './repositories/fee.repository';
import { ErpCoreAuditLogRepository } from './repositories/audit-log.repository';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';
import type { TenantContext } from '../prisma/tenant-context';

describe('FeesService', () => {
  let service: FeesService;

  const unrestrictedTenant: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  const mockFeeRepository = {
    findInvoiceWithPayments: jest.fn(),
    createPayment: jest.fn(),
    updateInvoiceStatusSimple: jest.fn(),
    findInvoiceById: jest.fn(),
    updateInvoiceStatus: jest.fn(),
    createInvoiceFromDto: jest.fn(),
    findInvoicesBySession: jest.fn(),
    findPaymentWithRefunds: jest.fn(),
    createRefund: jest.fn(),
    findRefundById: jest.fn(),
    updateRefundStatus: jest.fn(),
    findAllRefunds: jest.fn(),
    findRefundsForPayment: jest.fn(),
    findInvoiceWithPaymentsAndRefunds: jest.fn(),
    findPaymentByGatewayId: jest.fn(),
    createWebhookPayment: jest.fn(),
    findPaymentWithContext: jest.fn(),
    createStructure: jest.fn(),
    findAllStructures: jest.fn(),
    findAllInvoices: jest.fn(),
    findAllPayments: jest.fn(),
    findEnrollmentsBySessionEnrolled: jest.fn(),
    findStructuresBySession: jest.fn(),
    findOverdueInvoices: jest.fn(),
    createInvoiceRaw: jest.fn(),
    deleteInvoice: jest.fn(),
  };
  const mockStudentRepository = {
    findActiveAcademicSession: jest.fn(),
    findEnrollmentByStudentAndSession: jest.fn(),
  };
  const mockAuditLogRepository = {
    findRecent: jest.fn(),
  };
  const mockCommService = {
    sendFeeReminder: jest.fn(),
  };
  const mockRenderer = { renderFeeReceipt: jest.fn() };
  const mockStorage = { uploadFile: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: CommunicationService, useValue: mockCommService },
        { provide: StudentRepository, useValue: mockStudentRepository },
        { provide: FeeRepository, useValue: mockFeeRepository },
        {
          provide: ErpCoreAuditLogRepository,
          useValue: mockAuditLogRepository,
        },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  describe('recordFeePayment', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      mockFeeRepository.findInvoiceWithPayments.mockResolvedValue(null);

      await expect(
        service.recordFeePayment('missing-id', {
          amountPaid: '500',
          paymentMode: 'UPI',
          referenceNo: 'ref-1',
          paymentDate: '2026-08-01',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('marks the invoice Paid once total payments cover the invoice amount', async () => {
      mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        status: 'Unpaid',
        payments: [{ amountPaid: '500' }],
      });
      mockFeeRepository.createPayment.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '500',
      });

      await service.recordFeePayment('inv-1', {
        amountPaid: '500',
        paymentMode: 'UPI',
        referenceNo: 'ref-1',
        paymentDate: '2026-08-01',
      });

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith(
        'inv-1',
        'Paid',
      );
    });

    it('leaves the invoice Unpaid when the payment only partially covers the balance', async () => {
      mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        status: 'Unpaid',
        payments: [],
      });
      mockFeeRepository.createPayment.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '300',
      });

      await service.recordFeePayment('inv-1', {
        amountPaid: '300',
        paymentMode: 'Cheque',
        referenceNo: 'ref-2',
        paymentDate: '2026-08-01',
      });

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith(
        'inv-1',
        'Unpaid',
      );
    });

    it('records the payment against the given payment mode and reference, not a fabricated gateway response', async () => {
      mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        status: 'Unpaid',
        payments: [],
      });
      mockFeeRepository.createPayment.mockResolvedValue({ id: 'pay-1' });

      await service.recordFeePayment('inv-1', {
        amountPaid: '1000',
        paymentMode: 'NetBanking',
        referenceNo: 'NB-REF-99',
        paymentDate: '2026-08-01',
      });

      expect(mockFeeRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'inv-1',
          paymentMode: 'NetBanking',
          referenceNo: 'NB-REF-99',
        }),
      );
    });
  });

  describe('createFeeInvoice', () => {
    it('throws BadRequestException when there is no active academic session', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue(null);

      await expect(
        service.createFeeInvoice({
          studentId: 's1',
          amount: '1000',
          dueDate: '2026-09-01',
          status: 'Unpaid',
        } as any, unrestrictedTenant),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the student has no enrollment in the active session', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({
        id: 'sess-1',
      });
      mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue(
        null,
      );

      await expect(
        service.createFeeInvoice({
          studentId: 's1',
          amount: '1000',
          dueDate: '2026-09-01',
          status: 'Unpaid',
        } as any, unrestrictedTenant),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the invoice against the resolved enrollment', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({
        id: 'sess-1',
      });
      mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue(
        { id: 'enr-1', studentId: 's1', campusId: 'campus-a' },
      );
      mockFeeRepository.createInvoiceFromDto.mockResolvedValue({
        id: 'inv-1',
        enrollment: null,
      });

      await service.createFeeInvoice(
        {
          studentId: 's1',
          amount: '1000',
          dueDate: '2026-09-01',
          status: 'Unpaid',
        },
        unrestrictedTenant,
      );

      expect(mockFeeRepository.createInvoiceFromDto).toHaveBeenCalledWith(
        expect.objectContaining({ enrollmentId: 'enr-1', amount: '1000' }),
      );
    });
  });

  describe('updateFeeInvoiceStatus', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      mockFeeRepository.findInvoiceById.mockResolvedValue(null);

      await expect(
        service.updateFeeInvoiceStatus('missing', 'Paid', unrestrictedTenant),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFinancialReports', () => {
    it('computes expected/collected/outstanding totals and flags overdue defaulters', async () => {
      mockFeeRepository.findInvoicesBySession.mockResolvedValue([
        {
          totalAmount: '1000',
          status: 'Paid',
          dueDate: '2026-01-01',
          enrollment: {
            student: { fullName: 'A' },
            section: { class: { grade: '10' } },
          },
        },
        {
          totalAmount: '500',
          status: 'Overdue',
          dueDate: '2020-01-01',
          enrollment: {
            student: { fullName: 'B' },
            section: { class: { grade: '9' } },
          },
        },
      ]);

      const report = await service.getFinancialReports(
        'sess-1',
        unrestrictedTenant,
      );

      expect(report.totalExpected).toBe(1500);
      expect(report.totalCollected).toBe(1000);
      expect(report.totalOutstanding).toBe(500);
      expect(report.defaulters).toHaveLength(1);
      expect(report.defaulters[0].studentName).toBe('B');
    });
  });

  describe('requestRefund', () => {
    it('throws NotFoundException when the payment does not exist', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue(null);

      await expect(
        service.requestRefund(
          'missing-payment',
          { amount: '100', reason: 'test' } as any,
          unrestrictedTenant,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a zero or negative refund amount', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [],
        invoice: { campusId: null },
      });

      await expect(
        service.requestRefund(
          'pay-1',
          { amount: '0', reason: 'test' } as any,
          unrestrictedTenant,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a refund that exceeds the remaining refundable balance', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [{ amount: '600', status: 'Approved' }],
        invoice: { campusId: null },
      });

      await expect(
        service.requestRefund(
          'pay-1',
          { amount: '500', reason: 'test' } as any,
          unrestrictedTenant,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('ignores Rejected refunds when computing the remaining refundable balance', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [{ amount: '900', status: 'Rejected' }],
        invoice: { campusId: null },
      });
      mockFeeRepository.createRefund.mockResolvedValue({ id: 'ref-1' });

      await service.requestRefund(
        'pay-1',
        { amount: '900', reason: 'test' } as any,
        unrestrictedTenant,
      );

      expect(mockFeeRepository.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ paymentId: 'pay-1', amount: '900' }),
      );
    });

    it('defaults refundMode to the original payment mode when not specified', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'Cheque',
        refunds: [],
        invoice: { campusId: null },
      });
      mockFeeRepository.createRefund.mockResolvedValue({ id: 'ref-1' });

      await service.requestRefund(
        'pay-1',
        { amount: '100', reason: 'test' } as any,
        unrestrictedTenant,
      );

      expect(mockFeeRepository.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ refundMode: 'Cheque' }),
      );
    });
  });

  describe('resolveRefund', () => {
    it('throws NotFoundException when the refund request does not exist', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue(null);

      await expect(
        service.resolveRefund(
          'missing',
          { status: 'Approved' } as any,
          unrestrictedTenant,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses to re-resolve a refund that is no longer Requested', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Approved',
        payment: { invoiceId: 'inv-1', invoice: { campusId: null } },
      });

      await expect(
        service.resolveRefund(
          'ref-1',
          { status: 'Rejected' } as any,
          unrestrictedTenant,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejecting a refund does not touch the invoice status', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1', invoice: { campusId: null } },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({
        id: 'ref-1',
        status: 'Rejected',
      });

      await service.resolveRefund(
        'ref-1',
        { status: 'Rejected' } as any,
        unrestrictedTenant,
      );

      expect(
        mockFeeRepository.findInvoiceWithPaymentsAndRefunds,
      ).not.toHaveBeenCalled();
      expect(
        mockFeeRepository.updateInvoiceStatusSimple,
      ).not.toHaveBeenCalled();
    });

    it('approving a full refund moves a Paid invoice back to Unpaid', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1', invoice: { campusId: null } },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({
        id: 'ref-1',
        status: 'Approved',
      });
      mockFeeRepository.findInvoiceWithPaymentsAndRefunds.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        payments: [
          {
            amountPaid: '1000',
            refunds: [{ amount: '1000', status: 'Approved' }],
          },
        ],
      });

      await service.resolveRefund(
        'ref-1',
        { status: 'Approved' } as any,
        unrestrictedTenant,
      );

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith(
        'inv-1',
        'Unpaid',
      );
    });

    it('approving a partial refund that still covers the invoice keeps it Paid', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1', invoice: { campusId: null } },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({
        id: 'ref-1',
        status: 'Approved',
      });
      mockFeeRepository.findInvoiceWithPaymentsAndRefunds.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        payments: [
          {
            amountPaid: '1000',
            refunds: [{ amount: '100', status: 'Approved' }],
          },
          { amountPaid: '200', refunds: [] },
        ],
      });

      await service.resolveRefund(
        'ref-1',
        { status: 'Approved' } as any,
        unrestrictedTenant,
      );

      // net paid = (1000 - 100) + 200 = 1100 >= 1000
      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith(
        'inv-1',
        'Paid',
      );
    });
  });

  describe('Campus Isolation Phase 3, Milestone 6 — ownership checks', () => {
    const restrictedTenant: TenantContext = {
      userId: 'staff-1',
      role: 'Fee Manager',
      permissions: ['MANAGE_FEES'],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    };

    describe('createFeeStructure', () => {
      it('defaults to the caller own campus when restricted and DTO omits campusId', async () => {
        mockFeeRepository.createStructure.mockResolvedValue({ id: 'fs-1' });
        await service.createFeeStructure(
          { name: 'A', amount: '100', cycle: 'Monthly', sessionId: 's1' } as any,
          restrictedTenant,
        );
        expect(mockFeeRepository.createStructure).toHaveBeenCalledWith(
          expect.objectContaining({ campusId: 'campus-a' }),
        );
      });

      it('rejects a restricted caller naming a different campus', async () => {
        await expect(
          service.createFeeStructure(
            {
              name: 'A',
              amount: '100',
              cycle: 'Monthly',
              sessionId: 's1',
              campusId: 'campus-b',
            } as any,
            restrictedTenant,
          ),
        ).rejects.toThrow(ForbiddenException);
        expect(mockFeeRepository.createStructure).not.toHaveBeenCalled();
      });

      it('allows an unrestricted caller to leave campusId unset (school-wide)', async () => {
        mockFeeRepository.createStructure.mockResolvedValue({ id: 'fs-1' });
        await service.createFeeStructure(
          { name: 'A', amount: '100', cycle: 'Monthly', sessionId: 's1' } as any,
          unrestrictedTenant,
        );
        expect(mockFeeRepository.createStructure).toHaveBeenCalledWith(
          expect.objectContaining({ campusId: undefined }),
        );
      });
    });

    describe('createFeeInvoice — cross-campus rejection', () => {
      it('rejects a restricted caller creating an invoice for a student outside their campus', async () => {
        mockStudentRepository.findActiveAcademicSession.mockResolvedValue({
          id: 'sess-1',
        });
        mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue(
          { id: 'enr-1', studentId: 's1', campusId: 'campus-b' },
        );

        await expect(
          service.createFeeInvoice(
            {
              studentId: 's1',
              amount: '1000',
              dueDate: '2026-09-01',
              status: 'Unpaid',
            } as any,
            restrictedTenant,
          ),
        ).rejects.toThrow(ForbiddenException);
        expect(mockFeeRepository.createInvoiceFromDto).not.toHaveBeenCalled();
      });

      it('explicitly sets campusId from the enrollment, not left to ambient middleware', async () => {
        mockStudentRepository.findActiveAcademicSession.mockResolvedValue({
          id: 'sess-1',
        });
        mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue(
          { id: 'enr-1', studentId: 's1', campusId: 'campus-a' },
        );
        mockFeeRepository.createInvoiceFromDto.mockResolvedValue({
          id: 'inv-1',
          enrollment: null,
        });

        await service.createFeeInvoice(
          {
            studentId: 's1',
            amount: '1000',
            dueDate: '2026-09-01',
            status: 'Unpaid',
          },
          restrictedTenant,
        );

        expect(mockFeeRepository.createInvoiceFromDto).toHaveBeenCalledWith(
          expect.objectContaining({ campusId: 'campus-a' }),
        );
      });
    });

    describe('by-id ownership checks (404, not 403, for cross-campus)', () => {
      it('updateFeeInvoiceStatus 404s when the invoice belongs to a different campus', async () => {
        mockFeeRepository.findInvoiceById.mockResolvedValue({
          id: 'inv-1',
          campusId: 'campus-b',
        });
        await expect(
          service.updateFeeInvoiceStatus('inv-1', 'Paid', restrictedTenant),
        ).rejects.toThrow(NotFoundException);
        expect(mockFeeRepository.updateInvoiceStatus).not.toHaveBeenCalled();
      });

      it('deleteFeeInvoice 404s when the invoice belongs to a different campus', async () => {
        mockFeeRepository.findInvoiceById.mockResolvedValue({
          id: 'inv-1',
          campusId: 'campus-b',
        });
        await expect(
          service.deleteFeeInvoice('inv-1', restrictedTenant),
        ).rejects.toThrow(NotFoundException);
        expect(mockFeeRepository.deleteInvoice).not.toHaveBeenCalled();
      });

      it('deleteFeeInvoice 404s for a genuinely missing id (unchanged behavior)', async () => {
        mockFeeRepository.findInvoiceById.mockResolvedValue(null);
        await expect(
          service.deleteFeeInvoice('missing', unrestrictedTenant),
        ).rejects.toThrow(NotFoundException);
        expect(mockFeeRepository.deleteInvoice).not.toHaveBeenCalled();
      });

      it('requestRefund 404s when the payment belongs to a different campus', async () => {
        mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
          id: 'pay-1',
          amountPaid: '1000',
          paymentMode: 'UPI',
          refunds: [],
          invoice: { campusId: 'campus-b' },
        });
        await expect(
          service.requestRefund(
            'pay-1',
            { amount: '100', reason: 'test' } as any,
            restrictedTenant,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('resolveRefund 404s when the refund belongs to a different campus', async () => {
        mockFeeRepository.findRefundById.mockResolvedValue({
          id: 'ref-1',
          status: 'Requested',
          payment: { invoiceId: 'inv-1', invoice: { campusId: 'campus-b' } },
        });
        await expect(
          service.resolveRefund(
            'ref-1',
            { status: 'Approved' } as any,
            restrictedTenant,
          ),
        ).rejects.toThrow(NotFoundException);
        expect(mockFeeRepository.updateRefundStatus).not.toHaveBeenCalled();
      });

      it('getRefundsForPayment 404s when the payment belongs to a different campus', async () => {
        mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
          id: 'pay-1',
          invoice: { campusId: 'campus-b' },
        });
        await expect(
          service.getRefundsForPayment('pay-1', restrictedTenant),
        ).rejects.toThrow(NotFoundException);
        expect(mockFeeRepository.findRefundsForPayment).not.toHaveBeenCalled();
      });

      it('getRefundsForPayment succeeds for a same-campus restricted caller', async () => {
        mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
          id: 'pay-1',
          invoice: { campusId: 'campus-a' },
        });
        mockFeeRepository.findRefundsForPayment.mockResolvedValue([]);
        await expect(
          service.getRefundsForPayment('pay-1', restrictedTenant),
        ).resolves.toEqual([]);
      });
    });

    describe('threading', () => {
      it('getFeeStructures threads tenantContext to the repository', async () => {
        mockFeeRepository.findAllStructures.mockResolvedValue([]);
        await service.getFeeStructures(restrictedTenant);
        expect(mockFeeRepository.findAllStructures).toHaveBeenCalledWith(
          restrictedTenant,
        );
      });

      it('getFeeInvoices threads tenantContext to the repository', async () => {
        mockFeeRepository.findAllInvoices.mockResolvedValue([]);
        await service.getFeeInvoices(restrictedTenant);
        expect(mockFeeRepository.findAllInvoices).toHaveBeenCalledWith(
          restrictedTenant,
        );
      });

      it('getFeePayments threads tenantContext to the repository', async () => {
        mockFeeRepository.findAllPayments.mockResolvedValue([]);
        await service.getFeePayments(restrictedTenant);
        expect(mockFeeRepository.findAllPayments).toHaveBeenCalledWith(
          restrictedTenant,
        );
      });

      it('getRefunds threads tenantContext to the repository', async () => {
        mockFeeRepository.findAllRefunds.mockResolvedValue([]);
        await service.getRefunds(restrictedTenant);
        expect(mockFeeRepository.findAllRefunds).toHaveBeenCalledWith(
          restrictedTenant,
        );
      });

      it('generateInvoicesJob threads tenantContext to both repository calls', async () => {
        mockFeeRepository.findEnrollmentsBySessionEnrolled.mockResolvedValue([]);
        mockFeeRepository.findStructuresBySession.mockResolvedValue([]);
        await service.generateInvoicesJob('sess-1', restrictedTenant);
        expect(
          mockFeeRepository.findEnrollmentsBySessionEnrolled,
        ).toHaveBeenCalledWith('sess-1', restrictedTenant);
        expect(mockFeeRepository.findStructuresBySession).toHaveBeenCalledWith(
          'sess-1',
          restrictedTenant,
        );
      });

      it('applyLateFeesJob threads tenantContext to the repository', async () => {
        mockFeeRepository.findOverdueInvoices.mockResolvedValue([]);
        await service.applyLateFeesJob(restrictedTenant);
        expect(mockFeeRepository.findOverdueInvoices).toHaveBeenCalledWith(
          expect.any(String),
          restrictedTenant,
        );
      });

      it('getFinancialReports threads tenantContext to the repository', async () => {
        mockFeeRepository.findInvoicesBySession.mockResolvedValue([]);
        await service.getFinancialReports('sess-1', restrictedTenant);
        expect(mockFeeRepository.findInvoicesBySession).toHaveBeenCalledWith(
          'sess-1',
          restrictedTenant,
        );
      });
    });
  });

  describe('Razorpay webhook', () => {
    const WEBHOOK_SECRET = 'test-webhook-secret';
    let originalWebhookSecret: string | undefined;
    let originalKeyId: string | undefined;
    let originalKeySecret: string | undefined;
    let webhookService: FeesService;

    const sign = (rawBody: Buffer) =>
      crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    beforeEach(async () => {
      originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      originalKeyId = process.env.RAZORPAY_KEY_ID;
      originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeesService,
          { provide: CommunicationService, useValue: mockCommService },
          { provide: StudentRepository, useValue: mockStudentRepository },
          { provide: FeeRepository, useValue: mockFeeRepository },
          {
            provide: ErpCoreAuditLogRepository,
            useValue: mockAuditLogRepository,
          },
          { provide: DocumentRenderingService, useValue: mockRenderer },
          { provide: StorageService, useValue: mockStorage },
        ],
      }).compile();

      webhookService = module.get<FeesService>(FeesService);
    });

    afterEach(() => {
      if (originalWebhookSecret === undefined) {
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
      } else {
        process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
      }
      if (originalKeyId === undefined) {
        delete process.env.RAZORPAY_KEY_ID;
      } else {
        process.env.RAZORPAY_KEY_ID = originalKeyId;
      }
      if (originalKeySecret === undefined) {
        delete process.env.RAZORPAY_KEY_SECRET;
      } else {
        process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
      }
    });

    describe('verifyRazorpayWebhookSignature', () => {
      it('accepts a signature computed with the configured secret over the exact raw body', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        expect(
          webhookService.verifyRazorpayWebhookSignature(rawBody, sign(rawBody)),
        ).toBe(true);
      });

      it('rejects a signature computed with the wrong secret', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const wrongSignature = crypto
          .createHmac('sha256', 'not-the-real-secret')
          .update(rawBody)
          .digest('hex');
        expect(
          webhookService.verifyRazorpayWebhookSignature(rawBody, wrongSignature),
        ).toBe(false);
      });

      it('rejects when the raw body has been tampered with after signing', () => {
        const rawBody = Buffer.from(JSON.stringify({ amount: 100 }));
        const signature = sign(rawBody);
        const tamperedBody = Buffer.from(JSON.stringify({ amount: 100000 }));
        expect(
          webhookService.verifyRazorpayWebhookSignature(tamperedBody, signature),
        ).toBe(false);
      });

      it('rejects when no signature header is present', () => {
        const rawBody = Buffer.from('{}');
        expect(
          webhookService.verifyRazorpayWebhookSignature(rawBody, undefined),
        ).toBe(false);
      });
    });

    describe('processRazorpayWebhook', () => {
      it('throws BadRequestException when the webhook secret is not configured on this server', async () => {
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            FeesService,
            { provide: CommunicationService, useValue: mockCommService },
            { provide: StudentRepository, useValue: mockStudentRepository },
            { provide: FeeRepository, useValue: mockFeeRepository },
            {
              provide: ErpCoreAuditLogRepository,
              useValue: mockAuditLogRepository,
            },
            { provide: DocumentRenderingService, useValue: mockRenderer },
            { provide: StorageService, useValue: mockStorage },
          ],
        }).compile();
        const unconfiguredService = module.get<FeesService>(FeesService);

        await expect(
          unconfiguredService.processRazorpayWebhook(
            Buffer.from('{}'),
            'any-signature',
            { event: 'payment.captured' },
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws UnauthorizedException when the signature does not match the raw body', async () => {
        const payload = {
          event: 'payment.captured',
          payload: { payment: { entity: { id: 'pay_123', amount: 100000 } } },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));

        await expect(
          webhookService.processRazorpayWebhook(
            rawBody,
            'totally-forged-signature',
            payload,
          ),
        ).rejects.toThrow(UnauthorizedException);
        expect(mockFeeRepository.createWebhookPayment).not.toHaveBeenCalled();
      });

      it('acknowledges but ignores non-payment.captured events without recording a payment', async () => {
        const payload = { event: 'payment.failed', payload: {} };
        const rawBody = Buffer.from(JSON.stringify(payload));

        const result = await webhookService.processRazorpayWebhook(
          rawBody,
          sign(rawBody),
          payload,
        );

        expect(result).toEqual({ status: 'ignored', event: 'payment.failed' });
        expect(mockFeeRepository.createWebhookPayment).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when the payload is missing a payment entity', async () => {
        const payload = { event: 'payment.captured', payload: {} };
        const rawBody = Buffer.from(JSON.stringify(payload));

        await expect(
          webhookService.processRazorpayWebhook(rawBody, sign(rawBody), payload),
        ).rejects.toThrow(BadRequestException);
      });

      it('returns already_processed for a redelivered event without creating a duplicate payment', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 100000,
                notes: { invoiceId: 'inv-1' },
              },
            },
          },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));
        mockFeeRepository.findPaymentByGatewayId.mockResolvedValue({
          id: 'existing-pay-1',
        });

        const result = await webhookService.processRazorpayWebhook(
          rawBody,
          sign(rawBody),
          payload,
        );

        expect(result).toEqual({
          status: 'already_processed',
          paymentId: 'existing-pay-1',
        });
        expect(mockFeeRepository.createWebhookPayment).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when the invoice cannot be resolved from the payload', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: { entity: { id: 'pay_123', amount: 100000, notes: {} } },
          },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));
        mockFeeRepository.findPaymentByGatewayId.mockResolvedValue(null);

        await expect(
          webhookService.processRazorpayWebhook(rawBody, sign(rawBody), payload),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws NotFoundException when the resolved invoice does not exist', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 100000,
                notes: { invoiceId: 'missing-invoice' },
              },
            },
          },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));
        mockFeeRepository.findPaymentByGatewayId.mockResolvedValue(null);
        mockFeeRepository.findInvoiceWithPayments.mockResolvedValue(null);

        await expect(
          webhookService.processRazorpayWebhook(rawBody, sign(rawBody), payload),
        ).rejects.toThrow(NotFoundException);
      });

      it('creates the payment from the verified payload and marks the invoice Paid when fully covered', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 100000, // paise -> 1000 rupees
                notes: { invoiceId: 'inv-1' },
              },
            },
          },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));
        mockFeeRepository.findPaymentByGatewayId.mockResolvedValue(null);
        mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
          id: 'inv-1',
          totalAmount: '1000',
          amount: '1000',
          status: 'Unpaid',
          payments: [],
        });
        mockFeeRepository.createWebhookPayment.mockResolvedValue({
          id: 'new-pay-1',
        });

        const result = await webhookService.processRazorpayWebhook(
          rawBody,
          sign(rawBody),
          payload,
        );

        expect(mockFeeRepository.createWebhookPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            invoiceId: 'inv-1',
            amountPaid: '1000',
            paymentMode: 'Razorpay',
            gatewayPaymentId: 'pay_123',
            createdBy: 'RAZORPAY_WEBHOOK',
          }),
        );
        expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith(
          'inv-1',
          'Paid',
        );
        expect(result).toEqual({ status: 'processed', paymentId: 'new-pay-1' });
      });

      it('does not mark the invoice Paid when the captured payment only partially covers the balance', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 30000, // paise -> 300 rupees
                notes: { invoiceId: 'inv-1' },
              },
            },
          },
        };
        const rawBody = Buffer.from(JSON.stringify(payload));
        mockFeeRepository.findPaymentByGatewayId.mockResolvedValue(null);
        mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
          id: 'inv-1',
          totalAmount: '1000',
          amount: '1000',
          status: 'Unpaid',
          payments: [],
        });
        mockFeeRepository.createWebhookPayment.mockResolvedValue({
          id: 'new-pay-1',
        });

        await webhookService.processRazorpayWebhook(rawBody, sign(rawBody), payload);

        expect(mockFeeRepository.updateInvoiceStatusSimple).not.toHaveBeenCalled();
      });
    });
  });

  describe('renderFeeReceiptPdf', () => {
    it('throws NotFoundException when the payment does not exist', async () => {
      mockFeeRepository.findPaymentWithContext.mockResolvedValue(null);
      await expect(service.renderFeeReceiptPdf('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the payment has no associated student', async () => {
      mockFeeRepository.findPaymentWithContext.mockResolvedValue({
        id: 'pay-1',
        invoice: { enrollment: { student: null, section: null }, payments: [] },
      });
      await expect(service.renderFeeReceiptPdf('pay-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('renders and uploads, returning the real url with the correct outstanding balance', async () => {
      mockFeeRepository.findPaymentWithContext.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '400',
        paymentMode: 'UPI',
        referenceNo: 'ref-1',
        paymentDate: '2026-08-01',
        invoice: {
          id: 'inv-1',
          totalAmount: '1000',
          amount: '1000',
          enrollment: {
            student: { fullName: 'Test Student', admissionNumber: 'ADM-1' },
            section: { name: 'B', class: { grade: 'Grade 8' } },
          },
          payments: [{ amountPaid: '400' }, { amountPaid: '200' }],
        },
      });
      mockRenderer.renderFeeReceipt.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/fee-receipts/inv-1/x.pdf' });

      const result = await service.renderFeeReceiptPdf('pay-1');

      expect(mockRenderer.renderFeeReceipt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pay-1', amountPaid: '400', paymentMode: 'UPI' }),
        expect.objectContaining({
          studentName: 'Test Student',
          admissionNumber: 'ADM-1',
          className: 'Grade 8 - B',
          balanceAfter: 400,
        }),
      );
      expect(result).toEqual({ url: '/uploads/fee-receipts/inv-1/x.pdf' });
    });
  });
});
