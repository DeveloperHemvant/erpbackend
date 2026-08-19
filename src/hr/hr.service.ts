import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private readonly renderer: DocumentRenderingService,
    private readonly storage: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------
  // LEAVE MANAGEMENT
  // ---------------------------------------------------------
  async getLeaveBalances(staffId: string, year: number) {
    return this.prisma.leaveBalance.findMany({ where: { staffId, year } });
  }

  async applyLeave(data: {
    staffId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    // Basic MVP validation: ensure they have balance
    const currentYear = new Date(data.startDate).getFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({
      where: {
        staffId: data.staffId,
        leaveType: data.leaveType,
        year: currentYear,
      },
    });

    if (!balance || balance.used >= balance.totalAllowed) {
      throw new BadRequestException(
        'Insufficient leave balance for this type.',
      );
    }

    return this.prisma.leaveApplication.create({
      data: {
        staffId: data.staffId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      },
    });
  }

  async getLeaveApplications(status?: string, staffId?: string) {
    return this.prisma.leaveApplication.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(staffId ? { staffId } : {}),
      },
      include: {
        staff: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async processLeave(
    id: string,
    status: 'Approved' | 'Rejected',
    resolvedById: string,
  ) {
    const leave = await this.prisma.leaveApplication.findUnique({
      where: { id },
    });
    if (!leave) throw new BadRequestException('Leave not found');

    if (status === 'Approved') {
      const currentYear = leave.startDate.getFullYear();
      const balance = await this.prisma.leaveBalance.findFirst({
        where: {
          staffId: leave.staffId,
          leaveType: leave.leaveType,
          year: currentYear,
        },
      });
      if (balance) {
        // Calculate days (simple MVP logic)
        const diffTime = Math.abs(
          leave.endDate.getTime() - leave.startDate.getTime(),
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { used: balance.used + diffDays },
        });
      }
    }

    const updated = await this.prisma.leaveApplication.update({
      where: { id },
      data: { status, resolvedById, resolvedAt: new Date() },
    });

    const tokens = await this.notificationsService.getTokensForUsers(
      [leave.staffId],
      'STAFF',
    );
    this.notificationsService
      .sendPushNotifications(
        tokens,
        `Leave ${status}`,
        `Your ${leave.leaveType} leave request has been ${status.toLowerCase()}.`,
        { route: '/modules/shared/my-leave' },
      )
      .catch((err) => console.error('Failed to notify leave decision', err));

    return updated;
  }

  // ---------------------------------------------------------
  // PAYROLL STRUCTURE (the base salary a staff member is on — separate
  // from the monthly payslips runPayroll() below generates from it)
  // ---------------------------------------------------------
  async getPayrollStructure(staffId: string) {
    return this.prisma.payrollStructure.findUnique({ where: { staffId } });
  }

  async upsertPayrollStructure(
    staffId: string,
    data: { basicSalary: number; allowances?: number; deductions?: number },
  ) {
    return this.prisma.payrollStructure.upsert({
      where: { staffId },
      create: {
        staffId,
        basicSalary: data.basicSalary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
      },
      update: {
        basicSalary: data.basicSalary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
      },
    });
  }

  /** Every active staff member with their current structure (or null if
   * never set) — the source for the HR-wide "who's missing a salary"
   * view, so gaps are caught before a payroll run silently skips them. */
  async listPayrollStructures() {
    const staff = await this.prisma.staff.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: { select: { name: true } },
        payrollStructure: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return staff.map((s) => ({
      staffId: s.id,
      fullName: s.fullName,
      email: s.email,
      role: s.role?.name,
      payrollStructure: s.payrollStructure,
    }));
  }

  // ---------------------------------------------------------
  // PAYROLL PROCESSING
  // ---------------------------------------------------------
  async runPayroll(month: number, year: number) {
    const activeStaff = await this.prisma.staff.findMany({
      where: { status: 'Active' },
      include: { payrollStructure: true },
    });

    const generatedPayslips: any[] = [];

    for (const staff of activeStaff) {
      if (!staff.payrollStructure) continue;

      const struct = staff.payrollStructure;

      // 1. Calculate Unapproved Absences (LOP)
      // MVP logic: Find all "Absent" records in this month
      // Start/End of month
      const endDate = new Date(year, month, 0);

      const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const absences = await this.prisma.attendanceRecord.count({
        where: {
          staffId: staff.id,
          status: 'Absent',
          date: { gte: startDateStr, lte: endDateStr },
        },
      });

      // Daily wage approximation
      const dailyWage = struct.basicSalary / 30;
      const lopDeductions = absences * dailyWage;

      // 2. Compute Net Salary
      const netSalary =
        struct.basicSalary +
        struct.allowances -
        struct.deductions -
        lopDeductions;

      // 3. Create or update this month's payslip (avoid duplicates on re-run)
      const payslipData = {
        basicSalary: struct.basicSalary,
        allowances: struct.allowances,
        fixedDeductions: struct.deductions,
        lopDeductions,
        netSalary,
      };
      const existing = await this.prisma.payslip.findFirst({
        where: { staffId: staff.id, month, year },
      });
      const payslip = existing
        ? await this.prisma.payslip.update({
            where: { id: existing.id },
            data: payslipData,
          })
        : await this.prisma.payslip.create({
            data: { staffId: staff.id, month, year, ...payslipData },
          });

      generatedPayslips.push(payslip);
    }

    return {
      success: true,
      count: generatedPayslips.length,
      payslips: generatedPayslips,
    };
  }

  async getPayslips(month?: number, year?: number) {
    return this.prisma.payslip.findMany({
      where: { month: month || undefined, year: year || undefined },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayslipsForStaff(staffId: string, month?: number, year?: number) {
    return this.prisma.payslip.findMany({
      where: { staffId, month: month || undefined, year: year || undefined },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findPayslipById(id: string) {
    return this.prisma.payslip.findUnique({
      where: { id },
      include: { staff: { select: { fullName: true, role: { select: { name: true } } } } },
    });
  }

  /** Rendered fresh each call — same reasoning as report cards/ID cards. */
  async renderPayslipPdf(id: string): Promise<{ url: string }> {
    const payslip = await this.findPayslipById(id);
    if (!payslip) throw new NotFoundException('Payslip not found.');

    const pdfBuffer = await this.renderer.renderPayslip(
      {
        month: payslip.month,
        year: payslip.year,
        basicSalary: Number(payslip.basicSalary),
        allowances: Number(payslip.allowances),
        fixedDeductions: Number(payslip.fixedDeductions),
        lopDeductions: Number(payslip.lopDeductions),
        netSalary: Number(payslip.netSalary),
      },
      {
        staffName: payslip.staff.fullName,
        role: payslip.staff.role?.name || 'Staff',
      },
    );

    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `payslips/${payslip.staffId}`,
      `payslip-${payslip.year}-${payslip.month}.pdf`,
      'application/pdf',
    );
    return { url };
  }

  // ---------------------------------------------------------
  // WORKLOAD & PERFORMANCE
  // ---------------------------------------------------------
  async getStaffWorkload(staffId: string) {
    return this.prisma.teacherAssignment.findMany({
      where: { staffId },
      include: {
        subject: true,
        section: { include: { class: true } },
      },
    });
  }

  async logPerformanceReview(data: any) {
    return this.prisma.performanceReview.create({ data });
  }

  async getPerformanceReviews() {
    return this.prisma.performanceReview.findMany({
      include: {
        staff: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPerformanceReviewsForStaff(staffId: string) {
    return this.prisma.performanceReview.findMany({
      where: { staffId },
      include: {
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
