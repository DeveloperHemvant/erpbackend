import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { CommunicationService } from '../communication/communication.service';
import { StudentRepository } from '../students/repositories/student.repository';
import { FeeRepository } from './repositories/fee.repository';
import { ErpCoreAuditLogRepository } from './repositories/audit-log.repository';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';
import type { TenantContext } from '../prisma/tenant-context';
import { requireCampusId } from '../prisma/tenant-context';
import { assertPendingStatus } from '../common/assert-pending-status.util';
import {
  CreateFeeStructureDto,
  CreateFeeInvoiceDto,
  CreateFeePaymentDto,
  RequestRefundDto,
  ResolveRefundDto,
} from './dto/fee.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private razorpayClient: Razorpay | null = null;
  private readonly razorpayWebhookSecret: string | null;

  constructor(
    private readonly commService: CommunicationService,
    private readonly studentRepository: StudentRepository,
    private readonly feeRepository: FeeRepository,
    private readonly auditLogRepository: ErpCoreAuditLogRepository,
    private readonly renderer: DocumentRenderingService,
    private readonly storage: StorageService,
  ) {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } =
      process.env;
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
    this.razorpayWebhookSecret = RAZORPAY_WEBHOOK_SECRET || null;
    if (!this.razorpayWebhookSecret) {
      this.logger.warn(
        'Razorpay webhook secret not configured (RAZORPAY_WEBHOOK_SECRET) — the payment webhook will reject every request until it is set, rather than accept unverified payment confirmations.',
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
  async createFeeStructure(
    dto: CreateFeeStructureDto,
    tenantContext: TenantContext,
  ) {
    // Campus Isolation Phase 3, Milestone 6 — same resolution shape as
    // StaffService.create(), except an unrestricted caller may validly omit
    // campusId here (stays school-wide, a real meaningful state per B3 —
    // unlike Staff, where every record must belong to exactly one campus).
    let campusId: string | undefined;
    if (tenantContext.canAccessAllCampuses) {
      campusId = dto.campusId;
    } else {
      const ownCampusId = requireCampusId(tenantContext);
      if (dto.campusId && dto.campusId !== ownCampusId) {
        throw new ForbiddenException(
          'Cannot create a fee structure for a different campus than your own.',
        );
      }
      campusId = ownCampusId;
    }

    // FeeStructure has no createdBy column (unlike most other models here) - passing it
    // used to throw a Prisma "Unknown arg" error, hidden by this file's former @ts-nocheck.
    return this.feeRepository.createStructure({ ...dto, campusId });
  }

  async getFeeStructures(tenantContext: TenantContext) {
    return this.feeRepository.findAllStructures(tenantContext);
  }

  async generateInvoicesJob(sessionId: string, tenantContext: TenantContext) {
    // Find all active enrollments for the session
    const enrollments =
      await this.feeRepository.findEnrollmentsBySessionEnrolled(
        sessionId,
        tenantContext,
      );

    const structures = await this.feeRepository.findStructuresBySession(
      sessionId,
      tenantContext,
    );

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
        // Campus Isolation Phase 3, Milestone 6 — explicit, not ambient
        // (same bug shape as Milestone 5's enrollStudent() fix).
        campusId: enr.campusId,
      });
      generatedCount++;
    }

    return { success: true, count: generatedCount };
  }

  async applyLateFeesJob(tenantContext: TenantContext) {
    // Find all Unpaid/Overdue invoices where dueDate has passed
    const today = new Date().toISOString().split('T')[0];

    const overdueInvoices = await this.feeRepository.findOverdueInvoices(
      today,
      tenantContext,
    );

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

  // Campus Isolation Phase 3, Milestone 6 — cross-tenant direct-by-id access
  // throws the same "not found" a genuinely-missing id already throws, not
  // a new 403 (same reasoning as Milestone 5's Staff/Students checks).
  // Staff-only helper — never call this on the payer-facing routes
  // (createRazorpayOrder/recordFeePayment/downloadFeeReceipt), which are
  // reachable by parent/student portal accounts whose TenantContext is
  // never campus-scoped by design (D2); those keep their own separate
  // OwnershipService identity check instead.
  private assertCampusAccessible(
    campusId: string | null,
    tenantContext: TenantContext,
    notFoundMessage: string,
  ) {
    if (
      !tenantContext.canAccessAllCampuses &&
      campusId !== tenantContext.campusId
    ) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  async createFeeInvoice(dto: CreateFeeInvoiceDto, tenantContext: TenantContext) {
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

    if (
      !tenantContext.canAccessAllCampuses &&
      enrollment.campusId !== tenantContext.campusId
    ) {
      throw new ForbiddenException(
        'Cannot create a fee invoice for a student outside your campus.',
      );
    }

    const invoice = await this.feeRepository.createInvoiceFromDto({
      enrollmentId: enrollment.id,
      amount: dto.amount,
      totalAmount: dto.amount,
      dueDate: dto.dueDate,
      status: dto.status,
      createdBy: 'SYSTEM',
      // Campus Isolation Phase 3, Milestone 6 — explicit, not ambient (same
      // bug shape as Milestone 5's enrollStudent() fix — the legacy
      // middleware leaves this null for every canAccessAllCampuses caller).
      campusId: enrollment.campusId,
    });

    return this.reshapeInvoice(invoice);
  }

  async getFeeInvoices(tenantContext: TenantContext) {
    const invoices = await this.feeRepository.findAllInvoices(tenantContext);
    return invoices.map((inv) => this.reshapeInvoice(inv));
  }

  async updateFeeInvoiceStatus(
    id: string,
    status: string,
    tenantContext: TenantContext,
  ) {
    const invoice = await this.feeRepository.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    this.assertCampusAccessible(
      invoice.campusId,
      tenantContext,
      'Invoice not found.',
    );

    const updated = await this.feeRepository.updateInvoiceStatus(id, status);
    return this.reshapeInvoice(updated);
  }

  async deleteFeeInvoice(id: string, tenantContext: TenantContext) {
    const invoice = await this.feeRepository.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    this.assertCampusAccessible(
      invoice.campusId,
      tenantContext,
      'Invoice not found.',
    );
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

  /** True HMAC-SHA256 comparison over the raw request body, per Razorpay's
   * webhook signing spec — never trust the parsed/re-serialized JSON for
   * this, key order or whitespace differences would break the digest. */
  verifyRazorpayWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
  ): boolean {
    if (!this.razorpayWebhookSecret || !signature || !rawBody) return false;
    const expected = crypto
      .createHmac('sha256', this.razorpayWebhookSecret)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }

  /**
   * Real Razorpay webhook (Phase 6) — replaces the old
   * fees/webhook/online-payment route, which required an authenticated
   * PAY_FEES/MANAGE_FEES caller and trusted a client-supplied
   * {invoiceId, amountPaid} with no signature at all: any parent could mark
   * *any* invoice paid for *any* amount by calling it directly. This route
   * is public (Razorpay's servers call it, not a logged-in user) and only
   * ever trusts amounts/invoice linkage it reads back out of a
   * signature-verified payload.
   */
  async processRazorpayWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    payload: any,
  ) {
    if (!this.razorpayWebhookSecret) {
      throw new BadRequestException(
        'Razorpay webhook is not configured on this server.',
      );
    }
    if (!this.verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    if (payload?.event !== 'payment.captured') {
      // Acknowledge (200) but take no action on events we don't handle
      // (order.paid, payment.failed, ...) — Razorpay retries on non-2xx.
      return { status: 'ignored', event: payload?.event };
    }

    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity?.id) {
      throw new BadRequestException(
        'Malformed webhook payload — missing payment entity.',
      );
    }

    const existing = await this.feeRepository.findPaymentByGatewayId(
      paymentEntity.id,
    );
    if (existing) {
      return { status: 'already_processed', paymentId: existing.id };
    }

    let invoiceId: string | undefined = paymentEntity.notes?.invoiceId;
    if (!invoiceId && paymentEntity.order_id && this.razorpayClient) {
      const order = await this.razorpayClient.orders.fetch(
        paymentEntity.order_id,
      );
      invoiceId = (order.notes as Record<string, string> | undefined)
        ?.invoiceId;
    }
    if (!invoiceId) {
      throw new BadRequestException(
        'Could not resolve which invoice this payment belongs to.',
      );
    }

    const invoice = await this.feeRepository.findInvoiceWithPayments(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found for this payment.');

    const amountPaid = paymentEntity.amount / 100; // paise -> rupees

    const payment = await this.feeRepository.createWebhookPayment({
      invoiceId,
      amountPaid: amountPaid.toString(),
      paymentMode: 'Razorpay',
      referenceNo: paymentEntity.id,
      gatewayPaymentId: paymentEntity.id,
      paymentDate: new Date().toISOString().split('T')[0],
      gatewayResponse: payload,
      createdBy: 'RAZORPAY_WEBHOOK',
    });

    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0) +
      amountPaid;
    const invoiceAmount = Number(invoice.totalAmount || invoice.amount);
    if (totalPaid >= invoiceAmount) {
      await this.feeRepository.updateInvoiceStatusSimple(invoiceId, 'Paid');
    }

    return { status: 'processed', paymentId: payment.id };
  }

  async getFeePayments(tenantContext: TenantContext) {
    return this.feeRepository.findAllPayments(tenantContext);
  }

  /** Rendered fresh on every call, same as ReportCardsService.renderReportCardPdf
   * — a receipt is a low-repeat-visit personal download, not worth a schema
   * field + staleness tracking. */
  async renderFeeReceiptPdf(paymentId: string): Promise<{ url: string }> {
    const payment = await this.feeRepository.findPaymentWithContext(paymentId);
    if (!payment) throw new NotFoundException('Payment not found.');

    const invoice = payment.invoice;
    const student = invoice?.enrollment?.student;
    const section = invoice?.enrollment?.section;
    if (!student) {
      throw new BadRequestException('This payment has no associated student.');
    }

    const invoiceAmount = Number(invoice.totalAmount || invoice.amount);
    const totalPaid = (invoice.payments || []).reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0,
    );
    const balanceAfter = Math.max(0, invoiceAmount - totalPaid);

    const pdfBuffer = await this.renderer.renderFeeReceipt(
      {
        id: payment.id,
        amountPaid: payment.amountPaid.toString(),
        paymentMode: payment.paymentMode,
        referenceNo: payment.referenceNo,
        paymentDate: payment.paymentDate,
      },
      {
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        className: section ? `${section.class?.grade ?? ''} - ${section.name}` : '—',
        invoiceTotal: (invoice.totalAmount || invoice.amount).toString(),
        balanceAfter,
      },
    );

    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `fee-receipts/${invoice.id}`,
      `receipt-${payment.id}.pdf`,
      'application/pdf',
    );
    return { url };
  }

  // ==========================================
  // REFUNDS
  // ==========================================
  async requestRefund(
    paymentId: string,
    dto: RequestRefundDto,
    tenantContext: TenantContext,
  ) {
    const payment = await this.feeRepository.findPaymentWithRefunds(paymentId);
    if (!payment) throw new NotFoundException('Payment not found.');
    this.assertCampusAccessible(
      payment.invoice.campusId,
      tenantContext,
      'Payment not found.',
    );

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

  async resolveRefund(
    id: string,
    dto: ResolveRefundDto,
    tenantContext: TenantContext,
  ) {
    const refund = await this.feeRepository.findRefundById(id);
    if (!refund) throw new NotFoundException('Refund request not found.');
    this.assertCampusAccessible(
      refund.payment.invoice.campusId,
      tenantContext,
      'Refund request not found.',
    );
    assertPendingStatus(refund.status, 'Requested', 'requests');

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

  async getRefunds(tenantContext: TenantContext) {
    return this.feeRepository.findAllRefunds(tenantContext);
  }

  async getRefundsForPayment(paymentId: string, tenantContext: TenantContext) {
    const payment = await this.feeRepository.findPaymentWithRefunds(paymentId);
    if (!payment) throw new NotFoundException('Payment not found.');
    this.assertCampusAccessible(
      payment.invoice.campusId,
      tenantContext,
      'Payment not found.',
    );
    return this.feeRepository.findRefundsForPayment(paymentId);
  }

  async getAuditLogs() {
    return this.auditLogRepository.findRecent();
  }

  async getFinancialReports(sessionId: string, tenantContext: TenantContext) {
    const invoices = await this.feeRepository.findInvoicesBySession(
      sessionId,
      tenantContext,
    );

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
