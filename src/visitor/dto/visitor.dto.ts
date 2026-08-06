import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsUUID()
  @IsOptional()
  hostId?: string;

  @IsString()
  @IsOptional()
  govIdType?: string;

  @IsString()
  @IsOptional()
  govIdNumber?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;
}

export class ConfirmVisitorDto {
  @IsString()
  @IsNotEmpty()
  status: string; // APPROVED, REJECTED
}

export class CreateStudentGatePassDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  leaveType: string; // EARLY, MEDICAL, PARENT_PICKUP, COMPETITION
}
