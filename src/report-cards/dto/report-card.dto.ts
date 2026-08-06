import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateReportCardDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: '96.5%' })
  @IsString()
  @IsNotEmpty()
  attendanceRate: string;

  @ApiProperty({ example: '3.84' })
  @IsString()
  @IsNotEmpty()
  gpa: string;

  @ApiProperty({
    example: 'Excellent student, outstanding performance.',
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}

export class GenerateReportCardDto {
  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 'e936551b-4d43-4011-8fe6-b3334863adfb' })
  @IsUUID()
  @IsNotEmpty()
  examId: string;
}
