import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import { CommunicationService } from '../communication/communication.service';
import { StudentRepository } from '../students/repositories/student.repository';
import { FeeRepository } from './repositories/fee.repository';
import { ErpCoreAuditLogRepository } from './repositories/audit-log.repository';
import {
  CreateFeeStructureDto,
  CreateFeeInvoiceDto,
  CreateFeePaymentDto,
  RequestRefundDto,
  ResolveRefundDto,
  WebhookPaymentDto,
} from './dto/fee.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private razorpayClient: Razorpay | null = null;

  constructor(
    private readonly commService: CommunicationService,
    private readonly studentRepository: StudentRepository,
    private readonly feeRepository: FeeRepository,
    private readonly auditLogRepository: ErpCoreAuditLogRepository,
  ) {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      this.razorpayClient = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });
    } else {
      this.logger.warn(
        'Razorpay not configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET) — fee payment order creation will return not_configured instead of a real order.',
      );
    }
  }

  // Flattens `invoice.enrollment.{student,section.class}` into the `invoice.student.*` shape
  // the frontend (web-app/app/dashboard/fees/page.tsx) actually consumes.
  private reshapeInvoice(invoice: any) {
    const { enrollment, ...rest } = invoice;
    return {
      ...rest,
      studentId: enrollment?.studentId,
      student: enrollment
        ? {
            fullName: enrollment.student?.fullName,
            admissionNumber: enrollment.student?.admissionNumber,
            grade: enrollment.section?.class,
            details: enrollment.student?.details,
          }
        : undefined,
    };
  }

  // ==========================================
  // FEES INVOICING & STRUCTURES
  // ==========================================
  async createFeeStructure(dto: CreateFeeStructureDto) {
    // FeeStructure has no createdBy column (unlike most other models here) - passing it
    // used to throw a Prisma "Unknown arg" error, hidden by this file's former @ts-nocheck.
    return this.feeRepository.createStructure({ ...dto });
  }

  async getFeeStructures() {
    return this.feeRepository.findAllStructures();
  }

  async generateInvoicesJob(sessionId: string) {
    // Find all active enrollments for the session
    const enrollments =
      await this.feeRepository.findEnrollmentsBySessionEnrolled(sessionId);

    const structures =
      await this.feeRepository.findStructuresBySession(sessionId);

    let generatedCount = 0;

    // In real app, you would check billing cycle dates, but for now we generate for all active students.
    for (const enr of enrollments) {
      // Find structure matching student's class, or general structure
      const struct =
        structures.find((s) => s.classId === enr.section.classId) ||
        structures[0];
      if (!struct) continue;

      await this.feeRepository.createInvoiceRaw({
        enrollmentId: enr.id,
        structureId: struct.id,
        amount: struct.amount,
        totalAmount: struct.amount,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // +15 days
        status: 'Unpaid',
        createdBy: 'SYSTEM',
      });
      generatedCount++;
    }

    return { success: true, count: generatedCount };
  }

  async applyLateFeesJob() {
    // Find all Unpaid/Overdue invoices where dueDate has passed
    const today = new Date().toISOString().split('T')[0];

    const overdueInvoices = await this.feeRepository.findOverdueInvoices(today);

    let updatedCount = 0;
    for (const inv of overdueInvoices) {
      // Example rule: add 5% late fee
      const baseAmount = Number(inv.amount);
      const lateFee = baseAmount * 0.05;
      const totalAmount = baseAmount + lateFee;

      const updatedInv = await this.feeRepository.updateInvoiceOverdue(
        inv.id,
        lateFee.toString(),
        totalAmount.toString(),
      );

      if (updatedInv.enrollment?.studentId) {
        this.commService
          .sendFeeReminder(
            updatedInv.enrollment.studentId,
            (updatedInv.totalAmount || updatedInv.amount).toString(),
            updatedInv.dueDate,
          )
          .catch(console.error);
      }

      updatedCount++;
    }

    return { success: true, count: updatedCount };
  }

  async createFeeInvoice(dto: CreateFeeInvoiceDto) {
    const activeSession =
      await this.studentRepository.findActiveAcademicSession();
    if (!activeSession)
      throw new BadRequestException('No active academic session found.');

    const enrollment =
      await this.studentRepository.findEnrollmentByStudentAndSession(
        dto.studentId,
        activeSession.id,
      );
    if (!enrollment)
      throw new BadRequestException(
        'Student is not enrolled in the active academic session.',
      );

    const invoice = await this.feeRepository.createInvoiceFromDto({
      enrollmentId: enrollment.id,
      amount: dto.amount,
      totalAmount: dto.amount,
      dueDate: dto.dueDate,
      status: dto.status,
      createdBy: 'SYSTEM',
    });

    return this.reshapeInvoice(invoice);
  }

  async getFeeInvoices() {
    const invoices = await this.feeRepository.findAllInvoices();
    return invoices.map((inv) => this.reshapeInvoice(inv));
  }

  async updateFeeInvoiceStatus(id: string, status: string) {
    const invoice = await this.feeRepository.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    const updated = await this.feeRepository.updateInvoiceStatus(id, status);
    return this.reshapeInvoice(updated);
  }

  async deleteFeeInvoice(id: string) {
    return this.feeRepository.deleteInvoice(id);
  }

  // ==========================================
  // FEE PAYMENTS & AUDIT LOGS
  // ==========================================
  // Phase 2 scaffold (SOR item 2.11): the fee payment UI/API were fully built
  // but the gateway itself was explicitly simulated (fees.tsx's own comment:
  // "Payment gateway is simulated"). This creates a real Razorpay order when
  // credentials are configured; recordFeePayment/processOnlinePaymentWebhook
  // above are untouched, so nothing that currently works changes behavior.
  async createRazorpayOrder(invoiceId: string) {
    const invoice = await this.feeRepository.findInvoiceWithPayments(invoiceId);
    if (!invoice) throw new NotFoundException('Fee Invoice not found.');

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0,
    );
    const invoiceAmount = Number(invoice.totalAmount || invoice.amount);
    const outstanding = invoiceAmount - totalPaid;
    if (outstanding <= 0) {
      throw new BadRequestException('This invoice has no outstanding balance.');
    }

    if (!this.razorpayClient) {
      return {
        status: 'not_configured',
        message:
          'Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real online payments.',
        outstanding,
      };
    }

    const order = await this.razorpayClient.orders.create({
      amount: Math.round(outstanding * 100), // paise
      currency: 'INR',
      receipt: `invoice-${invoiceId}`,
      notes: { invoiceId },
    });

    return { status: 'created', order };
  }

  async recordFeePayment(invoiceId: string, dto: CreateFeePaymentDto) {
    const invoice = await this.feeRepository.findInvoiceWithPayments(invoiceId);
    if (!invoice) throw new NotFoundException('Fee Invoice not found.');

    // Create the payment record
    const payment = await this.feeRepository.createPayment({
      invoiceId,
      amountPaid: dto.amountPaid,
      paymentMode: dto.paymentMode,
      referenceNo: dto.referenceNo || null,
      paymentDate: dto.paymentDate,
      createdBy: 'SYSTEM',
    });

    // Re-calculate invoice status
    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0) +
      Number(dto.amountPaid);
    const invoiceAmount = Number(invoice.totalAmount || invoice.amount);

    let newStatus = invoice.status;
    if (totalPaid >= invoiceAmount) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Unpaid'; // or "Partial"
    }

    await this.feeRepository.updateInvoiceStatusSimple(invoiceId, newStatus);

    return payment;
  }

  async processOnlinePaymentWebhook(payload: WebhookPaymentDto) {
    // Simulate receiving a webhook from Stripe/Razorpay
    // Payload should contain invoiceId and status
    const { invoiceId, amountPaid, paymentMode, referenceNo, gatewayResponse } =
      payload;

    const invoice = await this.feeRepository.findInvoiceById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.feeRepository.createWebhookPayment({
      invoiceId,
      amountPaid: amountPaid.toString(),
      paymentMode: paymentMode || 'Stripe',
      referenceNo: referenceNo || `TRX-${Date.now()}`,
      paymentDate: new Date().toISOString().split('T')[0],
      gatewayResponse: gatewayResponse,
      createdBy: 'WEBHOOK',
    });
    // In a real flow, we'd also trigger recordFeePayment logic or similar to update invoice status.
    // For this mock, we'll just update it directly here.
  }

  async getFeePayments() {
    return this.feeRepository.findAllPayments();
  }

  // ==========================================
  // REFUNDS
  // ==========================================
  async requestRefund(paymentId: string, dto: RequestRefundDto) {
    const payment = await this.feeRepository.findPaymentWithRefunds(paymentId);
    if (!payment) throw new NotFoundException('Payment not found.');

    const requestedAmount = Number(dto.amount);
    if (!(requestedAmount > 0)) {
      throw new BadRequestException('Refund amount must be greater than zero.');
    }

    // Requested + Approved refunds both hold a claim against the payment; only
    // Rejected ones free up the balance again.
    const alreadyClaimed = (payment.refunds || [])
      .filter((r) => r.status !== 'Rejected')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const remaining = Number(payment.amountPaid) - alreadyClaimed;

    if (requestedAmount > remaining) {
      throw new BadRequestException(
        `Refund amount exceeds the remaining refundable balance (${remaining}) on this payment.`,
      );
    }

    return this.feeRepository.createRefund({
      paymentId,
      amount: dto.amount,
      reason: dto.reason,
      refundMode: dto.refundMode || payment.paymentMode,
      requestedBy: dto.requestedBy || 'SYSTEM',
    });
  }

  async resolveRefund(id: string, dto: ResolveRefundDto) {
    const refund = await this.feeRepository.findRefundById(id);
    if (!refund) throw new NotFoundException('Refund request not found.');
    if (refund.status !== 'Requested') {
      throw new BadRequestException(
        `Only pending requests can be resolved (current status: ${refund.status}).`,
      );
    }

    const updated = await this.feeRepository.updateRefundStatus(id, {
      status: dto.status,
      referenceNo: dto.referenceNo || null,
      approvedBy: dto.approvedBy || null,
      remarks: dto.remarks || null,
      resolvedAt: new Date(),
    });

    if (dto.status === 'Approved') {
      await this.recalculateInvoiceAfterRefund(refund.payment.invoiceId);
    }

    return updated;
  }

  private async recalculateInvoiceAfterRefund(invoiceId: string) {
    const invoice =
      await this.feeRepository.findInvoiceWithPaymentsAndRefunds(invoiceId);
    if (!invoice) return;

    const netPaid = invoice.payments.reduce((sum, p) => {
      const refundedOnThisPayment = (p.refunds || [])
        .filter((r) => r.status === 'Approved')
        .reduce((s, r) => s + Number(r.amount), 0);
      return sum + (Number(p.amountPaid) - refundedOnThisPayment);
    }, 0);

    const invoiceAmount = Number(invoice.totalAmount || invoice.amount);
    const newStatus = netPaid >= invoiceAmount ? 'Paid' : 'Unpaid';

    await this.feeRepository.updateInvoiceStatusSimple(invoiceId, newStatus);
  }

  async getRefunds() {
    return this.feeRepository.findAllRefunds();
  }

  async getRefundsForPayment(paymentId: string) {
    return this.feeRepository.findRefundsForPayment(paymentId);
  }

  async getAuditLogs() {
    return this.auditLogRepository.findRecent();
  }

  async getFinancialReports(sessionId: string) {
    const invoices = await this.feeRepository.findInvoicesBySession(sessionId);

    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const defaulters: any[] = [];

    invoices.forEach((inv) => {
      const amount = Number(inv.totalAmount || inv.amount);
      totalExpected += amount;
      if (inv.status === 'Paid') {
        totalCollected += amount;
      } else {
        totalOutstanding += amount;
        if (inv.status === 'Overdue' || new Date(inv.dueDate) < new Date()) {
          defaulters.push({
            studentName: inv.enrollment.student.fullName,
            class: inv.enrollment.section.class.grade,
            amountDue: amount,
            dueDate: inv.dueDate,
          });
        }
      }
    });

    const collectionRate =
      totalExpected > 0
        ? ((totalCollected / totalExpected) * 100).toFixed(1)
        : '0.0';

    return {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate,
      defaulters,
    };
  }
}
