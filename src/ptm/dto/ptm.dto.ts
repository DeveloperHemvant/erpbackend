import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreatePTMSlotDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class BookPTMSlotDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;
}
