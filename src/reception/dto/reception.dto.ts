import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class LogCourierDto {
  @IsString()
  @IsNotEmpty()
  type: string; // INCOMING, OUTGOING

  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateCourierStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Received, Dispatched, Collected
}

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsDateString()
  scheduledFor: string;
}

export class UpdateAppointmentStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Scheduled, Completed, Cancelled
}
