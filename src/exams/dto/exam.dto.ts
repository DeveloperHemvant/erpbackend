import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ example: 'Mid-Term 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Term 1', required: false })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'Scheduled', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateExamSlotDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '2026-08-10' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Room 102' })
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class ExamMarkEntryDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 85, required: false })
  @IsNumber()
  @IsOptional()
  marksObtained?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;
}

export class SubmitExamMarksDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  examSlotId: string;

  @ApiProperty({ type: [ExamMarkEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamMarkEntryDto)
  marks: ExamMarkEntryDto[];
}
