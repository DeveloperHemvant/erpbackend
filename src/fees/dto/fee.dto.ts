import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'Grade 10 General' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '15000' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ example: 'Monthly', enum: ['Monthly', 'Quarterly', 'Annual'] })
  @IsString()
  @IsNotEmpty()
  cycle: string;

  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: 'e936551b-4d43-4011-8fe6-b3334863adfb',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiProperty({
    description:
      'Optional campus scope, independent of classId — omit for a school-wide structure (or one that derives its scope from classId), or for a campus-restricted caller to default to their own campus. Cross-campus callers must have canAccessAllCampuses.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  campusId?: string;
}

export class CreateFeeInvoiceDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: '1500' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: 'Unpaid', enum: ['Paid', 'Unpaid', 'Overdue'] })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateFeePaymentDto {
  @ApiProperty({ example: '1500' })
  @IsString()
  @IsNotEmpty()
  amountPaid: string;

  @ApiProperty({
    example: 'UPI',
    enum: ['Cash', 'UPI', 'NetBanking', 'Cheque', 'Stripe', 'Razorpay'],
  })
  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @ApiProperty({ example: 'UPI-Ref-12345', required: false })
  @IsString()
  @IsOptional()
  referenceNo?: string;

  @ApiProperty({ example: '2026-07-19' })
  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  gatewayResponse?: any;
}

export class RequestRefundDto {
  @ApiProperty({ example: '500' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ example: 'Duplicate payment recorded by front desk' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example: 'UPI',
    enum: ['Cash', 'UPI', 'NetBanking', 'Cheque', 'Original'],
    required: false,
  })
  @IsString()
  @IsOptional()
  refundMode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requestedBy?: string;
}

export class ResolveRefundDto {
  @ApiProperty({ example: 'Approved', enum: ['Approved', 'Rejected'] })
  @IsIn(['Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'REFUND-UPI-REF-1', required: false })
  @IsString()
  @IsOptional()
  referenceNo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  approvedBy?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

