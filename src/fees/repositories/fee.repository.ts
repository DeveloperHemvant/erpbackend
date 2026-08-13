import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';
import { requireCampusId } from '../../prisma/tenant-context';

function campusFilter(tenantContext: TenantContext): { campusId: string } | {} {
  return tenantContext.canAccessAllCampuses
    ? {}
    : { campusId: requireCampusId(tenantContext) };
}

// FeeStructure's own campusId (Phase 0b/B3) is permanently optional by
// design — null means "not campus-restricted," derive from classId's own
// campus if set, otherwise genuinely school-wide. So a restricted caller
// can see: their own campus's structures, class-derived structures for
// their campus, AND structures with no campus concept at all either way.
function feeStructureVisibility(
  tenantContext: TenantContext,
): Prisma.FeeStructureWhereInput {
  if (tenantContext.canAccessAllCampuses) return {};
  const campusId = requireCampusId(tenantContext);
  return {
    OR: [
      { campusId },
      { campusId: null, class: { campusId } },
      { campusId: null, classId: null },
    ],
  };
}

@Injectable()
export class FeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  createStructure(data: Prisma.FeeStructureUncheckedCreateInput) {
    return this.prisma.feeStructure.create({ data });
  }

  findAllStructures(tenantContext: TenantContext) {
    return this.prisma.feeStructure.findMany({
      where: feeStructureVisibility(tenantContext),
      include: { class: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findEnrollmentsBySessionEnrolled(
    sessionId: string,
    tenantContext: TenantContext,
  ) {
    return this.prisma.studentEnrollment.findMany({
      where: {
        sessionId,
        status: 'Enrolled',
        ...campusFilter(tenantContext),
      },
      include: { section: { include: { class: true } } },
    });
  }

  findStructuresBySession(sessionId: string, tenantContext: TenantContext) {
    return this.prisma.feeStructure.findMany({
      where: { sessionId, ...feeStructureVisibility(tenantContext) },
    });
  }

  createInvoiceRaw(data: Prisma.FeeInvoiceUncheckedCreateInput) {
    return this.prisma.feeInvoice.create({ data });
  }

  findOverdueInvoices(today: string, tenantContext: TenantContext) {
    return this.prisma.feeInvoice.findMany({
      where: {
        status: { in: ['Unpaid', 'Overdue'] },
        dueDate: { lt: today },
        ...campusFilter(tenantContext),
      },
    });
  }

  updateInvoiceOverdue(id: string, lateFeeAmount: string, totalAmount: string) {
    return this.prisma.feeInvoice.update({
      where: { id },
      data: { status: 'Overdue', lateFeeAmount, totalAmount },
      include: { enrollment: true },
    });
  }

  createInvoiceFromDto(data: Prisma.FeeInvoiceUncheckedCreateInput) {
    return this.prisma.feeInvoice.create({
      data,
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
      },
    });
  }

  findAllInvoices(tenantContext: TenantContext) {
    return this.prisma.feeInvoice.findMany({
      where: campusFilter(tenantContext),
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  findInvoiceById(id: string) {
    return this.prisma.feeInvoice.findUnique({ where: { id } });
  }

  updateInvoiceStatus(id: string, status: string) {
    return this.prisma.feeInvoice.update({
      where: { id },
      data: { status },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
        payments: true,
      },
    });
  }

  deleteInvoice(id: string) {
    return this.prisma.feeInvoice.delete({ where: { id } });
  }

  findInvoiceWithPayments(id: string) {
    return this.prisma.feeInvoice.findUnique({
      where: { id },
      include: { payments: true },
    });
  }

  createPayment(data: Prisma.FeePaymentUncheckedCreateInput) {
    return this.prisma.feePayment.create({ data });
  }

  updateInvoiceStatusSimple(id: string, status: string) {
    return this.prisma.feeInvoice.update({ where: { id }, data: { status } });
  }

  createWebhookPayment(data: Prisma.FeePaymentUncheckedCreateInput) {
    return this.prisma.feePayment.create({ data });
  }

  /** Idempotency check for the Razorpay webhook — Razorpay redelivers events
   * on timeout/retry, and gatewayPaymentId is the one field that uniquely
   * identifies "we already recorded this specific Razorpay payment." */
  findPaymentByGatewayId(gatewayPaymentId: string) {
    return this.prisma.feePayment.findFirst({ where: { gatewayPaymentId } });
  }

  findAllPayments(tenantContext: TenantContext) {
    return this.prisma.feePayment.findMany({
      where: tenantContext.canAccessAllCampuses
        ? {}
        : { invoice: { campusId: requireCampusId(tenantContext) } },
      include: { invoice: { include: { enrollment: true } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  findInvoicesBySession(sessionId: string, tenantContext: TenantContext) {
    return this.prisma.feeInvoice.findMany({
      where: { enrollment: { sessionId }, ...campusFilter(tenantContext) },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
        },
      },
    });
  }

  findPaymentWithContext(paymentId: string) {
    return this.prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            enrollment: {
              include: { student: true, section: { include: { class: true } } },
            },
            payments: true,
          },
        },
      },
    });
  }

  findPaymentWithRefunds(paymentId: string) {
    return this.prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: { refunds: true, invoice: { include: { payments: true } } },
    });
  }

  createRefund(data: Prisma.FeeRefundUncheckedCreateInput) {
    return this.prisma.feeRefund.create({ data });
  }

  findRefundById(id: string) {
    return this.prisma.feeRefund.findUnique({
      where: { id },
      include: {
        payment: { include: { invoice: { include: { payments: true } } } },
      },
    });
  }

  updateRefundStatus(id: string, data: Prisma.FeeRefundUncheckedUpdateInput) {
    return this.prisma.feeRefund.update({ where: { id }, data });
  }

  findAllRefunds(tenantContext: TenantContext) {
    return this.prisma.feeRefund.findMany({
      where: tenantContext.canAccessAllCampuses
        ? {}
        : {
            payment: {
              invoice: { campusId: requireCampusId(tenantContext) },
            },
          },
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                enrollment: {
                  include: {
                    student: true,
                    section: { include: { class: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  findRefundsForPayment(paymentId: string) {
    return this.prisma.feeRefund.findMany({
      where: { paymentId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  findInvoiceWithPaymentsAndRefunds(id: string) {
    return this.prisma.feeInvoice.findUnique({
      where: { id },
      include: { payments: { include: { refunds: true } } },
    });
  }
}
