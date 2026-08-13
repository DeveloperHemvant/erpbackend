import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { HrService } from './hr.service';
import {
  ApplyLeaveDto,
  ProcessLeaveDto,
  RunPayrollDto,
  LogPerformanceReviewDto,
} from './dto/hr.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireSelfOrPermission } from '../auth/self-or-permission.decorator';
import { SelfOrPermissionGuard } from '../auth/self-or-permission.guard';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('HR')
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('leave-balances/:staffId/:year')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('staffId', 'MANAGE_HR')
  @RequirePermissions()
  @ApiOperation({
    summary:
      "Get leave balances for staff — the staff member's own balances, or any for HR/admins",
  })
  async getLeaveBalances(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Param('year') year: string,
  ) {
    return this.hrService.getLeaveBalances(staffId, parseInt(year, 10));
  }

  @Post('leave-applications')
  @RequirePermissions()
  @ApiOperation({ summary: 'Apply for Leave' })
  async applyLeave(@Body() data: ApplyLeaveDto) {
    return this.hrService.applyLeave(data);
  }

  @Get('leave-applications')
  @RequirePermissions()
  @ApiOperation({
    summary:
      "List leave applications — your own, or org-wide for HR/admins. Non-HR callers are always scoped to their own applications server-side, regardless of query params.",
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({
    name: 'staffId',
    required: false,
    description:
      'Only honored for HR/admin callers (MANAGE_HR); ignored otherwise since non-HR callers are forced to their own id.',
  })
  async getLeaveApplications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
  ) {
    const isHr =
      user.permissions?.includes('*') ||
      user.permissions?.includes('MANAGE_HR');
    return this.hrService.getLeaveApplications(
      status,
      isHr ? staffId : user.userId,
    );
  }

  @Patch('leave-applications/:id/process')
  @RequirePermissions('MANAGE_HR')
  @ApiOperation({ summary: 'Approve or Reject Leave' })
  async processLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: ProcessLeaveDto,
  ) {
    return this.hrService.processLeave(id, data.status, data.resolvedById);
  }

  @Post('payroll/run')
  @RequirePermissions('MANAGE_HR')
  @ApiOperation({ summary: 'Run Payroll' })
  async runPayroll(@Body() data: RunPayrollDto) {
    return this.hrService.runPayroll(data.month, data.year);
  }

  @Get('payslips')
  @RequirePermissions('MANAGE_HR')
  @ApiOperation({ summary: 'List generated payslips (admin/HR — all staff)' })
  async getPayslips(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.hrService.getPayslips(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('payslips/:staffId')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('staffId', 'MANAGE_HR')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Get payslips for one staff member — their own, or any for HR/admins',
  })
  @ApiParam({ name: 'staffId', format: 'uuid' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getPayslipsForStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.hrService.getPayslipsForStaff(
      staffId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  // Own-record download, keyed by payslip id rather than staffId, so
  // ownership is checked inline (fetch then compare) instead of via
  // RequireSelfOrPermission — same pattern as ReportCardsController.
  @Get('payslips/:id/pdf')
  @RequirePermissions()
  @ApiOperation({ summary: 'Render this payslip as a real PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async downloadPayslipPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isHr = user.permissions.includes('*') || user.permissions.includes('MANAGE_HR');
    if (!isHr) {
      const payslip = await this.hrService.findPayslipById(id);
      if (!payslip || payslip.staffId !== user.userId) {
        throw new ForbiddenException('You do not have access to this payslip.');
      }
    }
    return this.hrService.renderPayslipPdf(id);
  }

  @Get('staff/:staffId/workload')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_HR', 'VIEW_REPORTS')
  @RequirePermissions()
  @ApiOperation({ summary: 'Get Staff Workload' })
  async getStaffWorkload(@Param('staffId', ParseUUIDPipe) staffId: string) {
    return this.hrService.getStaffWorkload(staffId);
  }

  @Post('performance-reviews')
  @RequirePermissions('MANAGE_HR')
  @ApiOperation({ summary: 'Log Performance Review' })
  async logPerformanceReview(@Body() data: LogPerformanceReviewDto) {
    return this.hrService.logPerformanceReview(data);
  }

  @Get('performance-reviews')
  @RequirePermissions('MANAGE_HR')
  @ApiOperation({ summary: 'List performance reviews (admin/HR — all staff)' })
  async getPerformanceReviews() {
    return this.hrService.getPerformanceReviews();
  }

  @Get('performance-reviews/:staffId')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('staffId', 'MANAGE_HR')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Get performance reviews for one staff member — their own, or any for HR/admins',
  })
  @ApiParam({ name: 'staffId', format: 'uuid' })
  async getPerformanceReviewsForStaff(
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    return this.hrService.getPerformanceReviewsForStaff(staffId);
  }
}
