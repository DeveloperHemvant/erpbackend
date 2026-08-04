import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CommunicationService } from '../communication/communication.service';
import { StudentRepository } from '../students/repositories/student.repository';
import { FeeRepository } from './repositories/fee.repository';
import { ErpCoreAuditLogRepository } from './repositories/audit-log.repository';

describe('FeesService', () => {
  let service: FeesService;

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: CommunicationService, useValue: mockCommService },
        { provide: StudentRepository, useValue: mockStudentRepository },
        { provide: FeeRepository, useValue: mockFeeRepository },
        { provide: ErpCoreAuditLogRepository, useValue: mockAuditLogRepository },
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
      mockFeeRepository.createPayment.mockResolvedValue({ id: 'pay-1', amountPaid: '500' });

      await service.recordFeePayment('inv-1', {
        amountPaid: '500',
        paymentMode: 'UPI',
        referenceNo: 'ref-1',
        paymentDate: '2026-08-01',
      } as any);

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith('inv-1', 'Paid');
    });

    it('leaves the invoice Unpaid when the payment only partially covers the balance', async () => {
      mockFeeRepository.findInvoiceWithPayments.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        status: 'Unpaid',
        payments: [],
      });
      mockFeeRepository.createPayment.mockResolvedValue({ id: 'pay-1', amountPaid: '300' });

      await service.recordFeePayment('inv-1', {
        amountPaid: '300',
        paymentMode: 'Cheque',
        referenceNo: 'ref-2',
        paymentDate: '2026-08-01',
      } as any);

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith('inv-1', 'Unpaid');
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
      } as any);

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
        service.createFeeInvoice({ studentId: 's1', amount: '1000', dueDate: '2026-09-01', status: 'Unpaid' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the student has no enrollment in the active session', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1' });
      mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue(null);

      await expect(
        service.createFeeInvoice({ studentId: 's1', amount: '1000', dueDate: '2026-09-01', status: 'Unpaid' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the invoice against the resolved enrollment', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1' });
      mockStudentRepository.findEnrollmentByStudentAndSession.mockResolvedValue({ id: 'enr-1', studentId: 's1' });
      mockFeeRepository.createInvoiceFromDto.mockResolvedValue({ id: 'inv-1', enrollment: null });

      await service.createFeeInvoice({ studentId: 's1', amount: '1000', dueDate: '2026-09-01', status: 'Unpaid' } as any);

      expect(mockFeeRepository.createInvoiceFromDto).toHaveBeenCalledWith(
        expect.objectContaining({ enrollmentId: 'enr-1', amount: '1000' }),
      );
    });
  });

  describe('updateFeeInvoiceStatus', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      mockFeeRepository.findInvoiceById.mockResolvedValue(null);

      await expect(service.updateFeeInvoiceStatus('missing', 'Paid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFinancialReports', () => {
    it('computes expected/collected/outstanding totals and flags overdue defaulters', async () => {
      mockFeeRepository.findInvoicesBySession.mockResolvedValue([
        {
          totalAmount: '1000',
          status: 'Paid',
          dueDate: '2026-01-01',
          enrollment: { student: { fullName: 'A' }, section: { class: { grade: '10' } } },
        },
        {
          totalAmount: '500',
          status: 'Overdue',
          dueDate: '2020-01-01',
          enrollment: { student: { fullName: 'B' }, section: { class: { grade: '9' } } },
        },
      ]);

      const report = await service.getFinancialReports('sess-1');

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
        service.requestRefund('missing-payment', { amount: '100', reason: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a zero or negative refund amount', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [],
      });

      await expect(
        service.requestRefund('pay-1', { amount: '0', reason: 'test' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a refund that exceeds the remaining refundable balance', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [{ amount: '600', status: 'Approved' }],
      });

      await expect(
        service.requestRefund('pay-1', { amount: '500', reason: 'test' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('ignores Rejected refunds when computing the remaining refundable balance', async () => {
      mockFeeRepository.findPaymentWithRefunds.mockResolvedValue({
        id: 'pay-1',
        amountPaid: '1000',
        paymentMode: 'UPI',
        refunds: [{ amount: '900', status: 'Rejected' }],
      });
      mockFeeRepository.createRefund.mockResolvedValue({ id: 'ref-1' });

      await service.requestRefund('pay-1', { amount: '900', reason: 'test' } as any);

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
      });
      mockFeeRepository.createRefund.mockResolvedValue({ id: 'ref-1' });

      await service.requestRefund('pay-1', { amount: '100', reason: 'test' } as any);

      expect(mockFeeRepository.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ refundMode: 'Cheque' }),
      );
    });
  });

  describe('resolveRefund', () => {
    it('throws NotFoundException when the refund request does not exist', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue(null);

      await expect(service.resolveRefund('missing', { status: 'Approved' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses to re-resolve a refund that is no longer Requested', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({ id: 'ref-1', status: 'Approved', payment: { invoiceId: 'inv-1' } });

      await expect(service.resolveRefund('ref-1', { status: 'Rejected' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejecting a refund does not touch the invoice status', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1' },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({ id: 'ref-1', status: 'Rejected' });

      await service.resolveRefund('ref-1', { status: 'Rejected' } as any);

      expect(mockFeeRepository.findInvoiceWithPaymentsAndRefunds).not.toHaveBeenCalled();
      expect(mockFeeRepository.updateInvoiceStatusSimple).not.toHaveBeenCalled();
    });

    it('approving a full refund moves a Paid invoice back to Unpaid', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1' },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({ id: 'ref-1', status: 'Approved' });
      mockFeeRepository.findInvoiceWithPaymentsAndRefunds.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        payments: [{ amountPaid: '1000', refunds: [{ amount: '1000', status: 'Approved' }] }],
      });

      await service.resolveRefund('ref-1', { status: 'Approved' } as any);

      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith('inv-1', 'Unpaid');
    });

    it('approving a partial refund that still covers the invoice keeps it Paid', async () => {
      mockFeeRepository.findRefundById.mockResolvedValue({
        id: 'ref-1',
        status: 'Requested',
        payment: { invoiceId: 'inv-1' },
      });
      mockFeeRepository.updateRefundStatus.mockResolvedValue({ id: 'ref-1', status: 'Approved' });
      mockFeeRepository.findInvoiceWithPaymentsAndRefunds.mockResolvedValue({
        id: 'inv-1',
        totalAmount: '1000',
        amount: '1000',
        payments: [
          { amountPaid: '1000', refunds: [{ amount: '100', status: 'Approved' }] },
          { amountPaid: '200', refunds: [] },
        ],
      });

      await service.resolveRefund('ref-1', { status: 'Approved' } as any);

      // net paid = (1000 - 100) + 200 = 1100 >= 1000
      expect(mockFeeRepository.updateInvoiceStatusSimple).toHaveBeenCalledWith('inv-1', 'Paid');
    });
  });
});
