import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
} from 'class-validator';

export class CreateHostelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  warden?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class AddHostelRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsInt()
  @IsNotEmpty()
  capacity: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class AllocateRoomDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;
}

export class FileGrievanceDto {
  @IsUUID()
  @IsNotEmpty()
  hostelId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class MarkHostelAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class UpdateHostelAllocationDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  roomId?: string;
}

export class CreateMessMenuDto {
  @IsUUID()
  @IsNotEmpty()
  hostelId: string;

  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @IsString()
  @IsNotEmpty()
  mealType: string;

  @IsString()
  @IsNotEmpty()
  items: string;
}

export class UpdateHostelGrievanceDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateHostelOutpassDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;
}

export class ResolveHostelOutpassDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Approved, Rejected
}
