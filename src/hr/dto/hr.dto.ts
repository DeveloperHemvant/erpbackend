import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class ApplyLeaveDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ProcessLeaveDto {
  @IsIn(['Approved', 'Rejected'])
  @IsNotEmpty()
  status: 'Approved' | 'Rejected';

  @IsUUID()
  @IsNotEmpty()
  resolvedById: string;
}

export class RunPayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  year: number;
}

export class LogPerformanceReviewDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @IsUUID()
  @IsNotEmpty()
  reviewerId: string;

  @IsString()
  @IsNotEmpty()
  cycle: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class UpsertPayrollStructureDto {
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  allowances?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deductions?: number;
}
