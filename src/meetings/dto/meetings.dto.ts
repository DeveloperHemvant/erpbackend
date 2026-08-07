import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsDateString()
  scheduledFor: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  attendeeIds?: string[];
}

export class UpdateMeetingStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Scheduled, Completed, Cancelled
}
