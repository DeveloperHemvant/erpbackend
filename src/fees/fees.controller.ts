import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import {
  CreateFeeInvoiceDto,
  CreateFeeStructureDto,
  CreateFeePaymentDto,
  RequestRefundDto,
  ResolveRefundDto,
  WebhookPaymentDto,
} from './dto/fee.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';

@ApiTags('ERP Core Features')
@Controller('erp-core')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('fees/structures')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Create a new fee structure' })
  createFeeStructure(@Body() dto: CreateFeeStructureDto) {
    return this.feesService.createFeeStructure(dto);
  }

  @Get('fees/structures')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List fee structures' })
  getFeeStructures() {
    return this.feesService.getFeeStructures();
  }

  @Post('fees/generate-invoices')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({
    summary: 'Job: Generate invoices for active enrollments in a session',
  })
  generateInvoicesJob(@Body('sessionId') sessionId: string) {
    return this.feesService.generateInvoicesJob(sessionId);
  }

  @Post('fees/apply-late-fees')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Job: Apply late fees to overdue invoices' })
  applyLateFeesJob() {
    return this.feesService.applyLateFeesJob();
  }

  @Post('fees')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Generate individual fee invoice' })
  createFeeInvoice(@Body() dto: CreateFeeInvoiceDto) {
    return this.feesService.createFeeInvoice(dto);
  }

  @Get('fees')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List fee ledger items' })
  getFeeInvoices() {
    return this.feesService.getFeeInvoices();
  }

  @Patch('fees/:id/status')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Update payment status (Paid/Unpaid/Overdue)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateFeeInvoiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.feesService.updateFeeInvoiceStatus(id, status);
  }

  @Delete('fees/:id')
  @RequirePermissions('MANAGE_FEES')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteFeeInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.deleteFeeInvoice(id);
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

  @Post('fees/webhook/online-payment')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('PAY_FEES', 'MANAGE_FEES')
  @RequirePermissions()
  @ApiOperation({ summary: 'Simulate webhook from payment gateway' })
  processOnlinePaymentWebhook(@Body() payload: WebhookPaymentDto) {
    return this.feesService.processOnlinePaymentWebhook(payload);
  }

  @Get('fees/reports/financial')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('MANAGE_FEES', 'VIEW_REPORTS')
  @RequirePermissions()
  @ApiOperation({ summary: 'Get financial reports for a session' })
  getFinancialReports(@Query('sessionId') sessionId: string) {
    return this.feesService.getFinancialReports(sessionId);
  }

  @Get('fees-payments')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List all fee payment transactions' })
  getFeePayments() {
    return this.feesService.getFeePayments();
  }

  @Post('fees/payments/:paymentId/refunds')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Request a refund against a recorded payment' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  requestRefund(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: RequestRefundDto,
  ) {
    return this.feesService.requestRefund(paymentId, dto);
  }

  @Get('fees/payments/:paymentId/refunds')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List refund requests for one payment' })
  @ApiParam({ name: 'paymentId', format: 'uuid' })
  getRefundsForPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.feesService.getRefundsForPayment(paymentId);
  }

  @Patch('fees/refunds/:id/resolve')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'Approve or reject a pending refund request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  resolveRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveRefundDto,
  ) {
    return this.feesService.resolveRefund(id, dto);
  }

  @Get('fees/refunds')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List all refund requests' })
  getRefunds() {
    return this.feesService.getRefunds();
  }

  @Get('audit-logs')
  @RequirePermissions('MANAGE_FEES')
  @ApiOperation({ summary: 'List system transactional audit logs' })
  getAuditLogs() {
    return this.feesService.getAuditLogs();
  }
}
