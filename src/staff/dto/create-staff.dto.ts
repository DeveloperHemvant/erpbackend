import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Official email address of the staff member',
    example: 'sarah.carson@school.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Full legal name of the educator or staff',
    example: 'Prof. Sarah Carson',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Secure password for login',
    example: 'StaffSecurePass123!',
    required: false,
  })
  @IsString()
  @IsOptional()
  passwordHash?: string; // The service will hash this or generate one if not provided

  @ApiProperty({
    description: 'UUID target of the role mapping',
    example: 'e936551b-4d43-4011-8fe6-b3334863adfb',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Active status of the staff member',
    example: 'Active',
    enum: ['Active', 'Inactive', 'Suspended'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive', 'Suspended'])
  status?: string;

  @ApiProperty({
    description: 'The actor performing this creation',
    example: 'admin@school.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({
    description: 'Optional metadata such as subject expertise or class ranges',
    required: false,
  })
  @IsOptional()
  details?: any;

  @ApiProperty({
    description:
      'Primary campus for this staff member. Optional for campus-restricted callers (defaults to their own campus); required for callers with cross-campus access (Super Admin/Principal), since there is no ambient campus to default to.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  campusId?: string;

  @ApiProperty({
    description:
      'Starting basic monthly salary. When provided, a PayrollStructure is created for this staff member atomically with the record itself, so they are picked up by the next payroll run. Omitted staff are not included in payroll until one is set later via PUT /hr/payroll-structure/:staffId.',
    example: 45000,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basicSalary?: number;

  @ApiProperty({
    description: 'Monthly allowances on top of the basic salary.',
    example: 5000,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  allowances?: number;

  @ApiProperty({
    description: 'Fixed standard monthly deductions (before any loss-of-pay calculation).',
    example: 1500,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deductions?: number;
}
