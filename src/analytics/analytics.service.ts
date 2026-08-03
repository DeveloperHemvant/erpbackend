// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    // 1. Attendance Summary (Today)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const totalRecords = await this.prisma.attendanceRecord.count({ where: { date: today } });
    const presentRecords = await this.prisma.attendanceRecord.count({ where: { date: today, status: "Present" } });
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // 2. Revenue (Total Collected vs Total Expected for all time or current session)
    const invoices = await this.prisma.feeInvoice.findMany();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === "Paid" ? parseFloat(inv.amount || "0") : 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.status !== "Paid" ? parseFloat(inv.amount || "0") : 0), 0);

    // 3. Staff Count
    const staffCount = await this.prisma.staff.count({ where: { status: "Active" } });

    // 4. Student Count
    const studentCount = await this.prisma.studentEnrollment.count({ where: { status: "Enrolled" } });

    return {
      attendanceRate,
      totalRevenue,
      totalOutstanding,
      staffCount,
      studentCount
    };
  }

  async getTrends() {
    // Fee Collection by Class
    const classes = await this.prisma.class.findMany({ include: { sections: { include: { enrollments: { include: { invoices: true } } } } } });
    const revenueByClass = classes.map(c => {
      let collected = 0;
      let outstanding = 0;
      c.sections.forEach(sec => {
        sec.enrollments.forEach(en => {
          en.invoices.forEach(inv => {
            if (inv.status === "Paid") collected += parseFloat(inv.amount || "0");
            else outstanding += parseFloat(inv.amount || "0");
          });
        });
      });
      return {
        name: c.grade,
        collected,
        outstanding
      };
    });

    // Attendance Trend (Last 7 Days)
    const attendanceTrend: { date: string, rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const total = await this.prisma.attendanceRecord.count({ where: { date: dateStr } });
      const present = await this.prisma.attendanceRecord.count({ where: { date: dateStr, status: "Present" } });
      
      attendanceTrend.push({
        date: dateStr.substring(5), // MM-DD
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      });
    }

    return {
      revenueByClass,
      attendanceTrend
    };
  }
}
