import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.leaveApplication.update({
      where: { id },
      data: { status, resolvedById, resolvedAt: new Date() },
    });
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
