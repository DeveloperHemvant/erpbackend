import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Headers,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import {
  CreateFeeInvoiceDto,
  CreateFeeStructureDto,
  CreateFeePaymentDto,
  RequestRefundDto,
  ResolveRefundDto,
} from './dto/fee.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { Public } from '../auth/public.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantContextInterceptor } from '../prisma/tenant-context.interceptor';
import type { TenantContext } from '../prisma/tenant-context';

@ApiTags('ERP Core Features')
@Controller('erp-core')
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly ownershipService: OwnershipService,
  ) {}

  @Post('fees/structures')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Create a new fee structure' })
  createFeeStructure(
    @Body() dto: CreateFeeStructureDto,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.createFeeStructure(dto, tenantContext);
  }

  @Get('fees/structures')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List fee structures' })
  getFeeStructures(@CurrentTenant() tenantContext: TenantContext) {
    return this.feesService.getFeeStructures(tenantContext);
  }

  @Post('fees/generate-invoices')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({
    summary: 'Job: Generate invoices for active enrollments in a session',
  })
  generateInvoicesJob(
    @Body('sessionId') sessionId: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.generateInvoicesJob(sessionId, tenantContext);
  }

  @Post('fees/apply-late-fees')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Job: Apply late fees to overdue invoices' })
  applyLateFeesJob(@CurrentTenant() tenantContext: TenantContext) {
    return this.feesService.applyLateFeesJob(tenantContext);
  }

  @Post('fees')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Generate individual fee invoice' })
  createFeeInvoice(
    @Body() dto: CreateFeeInvoiceDto,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.createFeeInvoice(dto, tenantContext);
  }

  @Get('fees')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List fee ledger items' })
  getFeeInvoices(@CurrentTenant() tenantContext: TenantContext) {
    return this.feesService.getFeeInvoices(tenantContext);
  }

  @Patch('fees/:id/status')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Update payment status (Paid/Unpaid/Overdue)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateFeeInvoiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.updateFeeInvoiceStatus(id, status, tenantContext);
  }

  @Delete('fees/:id')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteFeeInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.deleteFeeInvoice(id, tenantContext);
  }

  @Post('fees/:id/payments/razorpay-order')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('PAY_FEES', 'MANAGE_FEES')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Create a Razorpay order for online payment of an invoice — returns not_configured if no credentials are set',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  createRazorpayOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.createRazorpayOrder(id);
  }

  @Post('fees/:id/payments')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('PAY_FEES', 'MANAGE_FEES')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Record a payment transaction on an invoice — parent self-payment or admin/accountant cash collection',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  recordFeePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFeePaymentDto,
  ) {
    return this.feesService.recordFeePayment(id, dto);
  }

  // Own-record download — same inline staff-or-ownership pattern as
  // ReportCardsController.downloadReportCardPdf: a parent/student never
  // holds MANAGE_FEES/PAY_FEES in the sense this route needs, so ownership
  // is checked directly via OwnershipService instead of the class default.
  @Get('fees/payments/:id/receipt')
  @RequirePermissions()
  @ApiOperation({ summary: 'Render (or re-render) a fee payment receipt as a real PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async downloadFeeReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isStaff =
      user.permissions.includes('*') ||
      user.permissions.includes('MANAGE_FEES') ||
      user.permissions.includes('PAY_FEES');
    if (!isStaff) {
      const role = (user.role || '').toLowerCase();
      if (role !== 'student' && role !== 'parent') {
        throw new ForbiddenException('You do not have access to this receipt.');
      }
      await this.ownershipService.assertOwnsFeePayment(user, id);
    }
    return this.feesService.renderFeeReceiptPdf(id);
  }

  // Public + signature-verified, not authenticated-user-callable: Razorpay's
  // servers call this directly, they have no school-user JWT. Replaces the
  // old fees/webhook/online-payment route, which required PAY_FEES/
  // MANAGE_FEES and trusted a client-supplied {invoiceId, amountPaid} with
  // zero signature check — any parent could have called it directly to mark
  // any invoice paid for any amount. See FeesService.processRazorpayWebhook.
  @Post('fees/webhook/razorpay')
  @Public()
  @ApiOperation({
    summary:
      "Razorpay payment webhook — signature-verified, called by Razorpay's servers only",
  })
  processRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Body() payload: any,
  ) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody as Buffer;
    return this.feesService.processRazorpayWebhook(rawBody, signature, payload);
  }

  @Get('fees/reports/financial')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Get financial reports for a session' })
  getFinancialReports(
    @Query('sessionId') sessionId: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.getFinancialReports(sessionId, tenantContext);
  }

  @Get('fees-payments')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List all fee payment transactions' })
  getFeePayments(@CurrentTenant() tenantContext: TenantContext) {
    return this.feesService.getFeePayments(tenantContext);
  }

  @Post('fees/payments/:paymentId/refunds')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Request a refund against a recorded payment' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  requestRefund(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: RequestRefundDto,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.requestRefund(paymentId, dto, tenantContext);
  }

  @Get('fees/payments/:paymentId/refunds')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List refund requests for one payment' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  getRefundsForPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.getRefundsForPayment(paymentId, tenantContext);
  }

  @Patch('fees/refunds/:id/resolve')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'Approve or reject a pending refund request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  resolveRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveRefundDto,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.feesService.resolveRefund(id, dto, tenantContext);
  }

  @Get('fees/refunds')
  @RequirePermissions('MANAGE_FEES')
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List all refund requests' })
  getRefunds(@CurrentTenant() tenantContext: TenantContext) {
    return this.feesService.getRefunds(tenantContext);
  }

  @Get('audit-logs')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List system transactional audit logs' })
  getAuditLogs() {
    return this.feesService.getAuditLogs();
  }
}
