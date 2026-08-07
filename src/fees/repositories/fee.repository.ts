import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  createStructure(data: Prisma.FeeStructureUncheckedCreateInput) {
    return this.prisma.feeStructure.create({ data });
  }

  findAllStructures() {
    return this.prisma.feeStructure.findMany({
      include: { class: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findEnrollmentsBySessionEnrolled(sessionId: string) {
    return this.prisma.studentEnrollment.findMany({
      where: { sessionId, status: 'Enrolled' },
      include: { section: { include: { class: true } } },
    });
  }

  findStructuresBySession(sessionId: string) {
    return this.prisma.feeStructure.findMany({ where: { sessionId } });
  }

  createInvoiceRaw(data: Prisma.FeeInvoiceUncheckedCreateInput) {
    return this.prisma.feeInvoice.create({ data });
  }

  findOverdueInvoices(today: string) {
    return this.prisma.feeInvoice.findMany({
      where: {
        status: { in: ['Unpaid', 'Overdue'] },
        dueDate: { lt: today },
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

  findAllInvoices() {
    return this.prisma.feeInvoice.findMany({
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

  findAllPayments() {
    return this.prisma.feePayment.findMany({
      include: { invoice: { include: { enrollment: true } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  findInvoicesBySession(sessionId: string) {
    return this.prisma.feeInvoice.findMany({
      where: { enrollment: { sessionId } },
      include: {
        enrollment: {
          include: { student: true, section: { include: { class: true } } },
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

  findAllRefunds() {
    return this.prisma.feeRefund.findMany({
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
