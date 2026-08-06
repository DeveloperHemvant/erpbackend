import { IsString, IsNotEmpty, IsBoolean, IsUUID } from 'class-validator';

export class CreateTimetableSlotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsBoolean()
  isBreak: boolean;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
