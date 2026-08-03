import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { HrService } from "./hr.service";
import { ApplyLeaveDto, ProcessLeaveDto, RunPayrollDto, LogPerformanceReviewDto } from "./dto/hr.dto";
import { RequirePermissions } from "../auth/permissions.decorator";
import { RequireSelfOrPermission } from "../auth/self-or-permission.decorator";
import { SelfOrPermissionGuard } from "../auth/self-or-permission.guard";

@ApiTags("HR")
@Controller("hr")
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get("leave-balances/:staffId/:year")
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission("staffId", "MANAGE_HR")
  @RequirePermissions()
  @ApiOperation({ summary: "Get leave balances for staff — the staff member's own balances, or any for HR/admins" })
  async getLeaveBalances(
    @Param("staffId", ParseUUIDPipe) staffId: string,
    @Param("year") year: string
  ) {
    return this.hrService.getLeaveBalances(staffId, parseInt(year, 10));
  }

  @Post("leave-applications")
  @ApiOperation({ summary: "Apply for Leave" })
  async applyLeave(@Body() data: ApplyLeaveDto) {
    return this.hrService.applyLeave(data);
  }

  @Get("leave-applications")
  @ApiOperation({ summary: "List leave applications" })
  async getLeaveApplications(@Query("status") status?: string) {
    return this.hrService.getLeaveApplications(status);
  }

  @Patch("leave-applications/:id/process")
  @ApiOperation({ summary: "Approve or Reject Leave" })
  async processLeave(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: ProcessLeaveDto
  ) {
    return this.hrService.processLeave(id, data.status, data.resolvedById);
  }

  @Post("payroll/run")
  @ApiOperation({ summary: "Run Payroll" })
  async runPayroll(@Body() data: RunPayrollDto) {
    return this.hrService.runPayroll(data.month, data.year);
  }

  @Get("payslips")
  @ApiOperation({ summary: "List generated payslips (admin/HR — all staff)" })
  async getPayslips(@Query("month") month?: string, @Query("year") year?: string) {
    return this.hrService.getPayslips(month ? parseInt(month, 10) : undefined, year ? parseInt(year, 10) : undefined);
  }

  @Get("payslips/:staffId")
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission("staffId", "MANAGE_HR")
  @RequirePermissions()
  @ApiOperation({ summary: "Get payslips for one staff member — their own, or any for HR/admins" })
  @ApiParam({ name: "staffId", format: "uuid" })
  @ApiQuery({ name: "month", required: false })
  @ApiQuery({ name: "year", required: false })
  async getPayslipsForStaff(
    @Param("staffId", ParseUUIDPipe) staffId: string,
    @Query("month") month?: string,
    @Query("year") year?: string
  ) {
    return this.hrService.getPayslipsForStaff(staffId, month ? parseInt(month, 10) : undefined, year ? parseInt(year, 10) : undefined);
  }

  @Get("staff/:staffId/workload")
  @ApiOperation({ summary: "Get Staff Workload" })
  async getStaffWorkload(@Param("staffId", ParseUUIDPipe) staffId: string) {
    return this.hrService.getStaffWorkload(staffId);
  }

  @Post("performance-reviews")
  @ApiOperation({ summary: "Log Performance Review" })
  async logPerformanceReview(@Body() data: LogPerformanceReviewDto) {
    return this.hrService.logPerformanceReview(data);
  }

  @Get("performance-reviews")
  @ApiOperation({ summary: "List performance reviews (admin/HR — all staff)" })
  async getPerformanceReviews() {
    return this.hrService.getPerformanceReviews();
  }

  @Get("performance-reviews/:staffId")
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission("staffId", "MANAGE_HR")
  @RequirePermissions()
  @ApiOperation({ summary: "Get performance reviews for one staff member — their own, or any for HR/admins" })
  @ApiParam({ name: "staffId", format: "uuid" })
  async getPerformanceReviewsForStaff(@Param("staffId", ParseUUIDPipe) staffId: string) {
    return this.hrService.getPerformanceReviewsForStaff(staffId);
  }
}
