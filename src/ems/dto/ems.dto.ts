import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  IsInt,
} from 'class-validator';

export class CreateEmsSessionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateEmsExamTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEmsExamTemplateDto {
  @IsUUID()
  @IsNotEmpty()
  typeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  totalMarks: number;

  @IsNumber()
  @IsNotEmpty()
  passMarks: number;
}

export class CreateEmsQuestionBankDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;
}

export class CreateEmsEvaluationDto {
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;

  @IsUUID()
  @IsNotEmpty()
  evaluatorId: string;

  @IsNumber()
  @IsNotEmpty()
  marksObtained: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateEmsGradebookDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class GenerateEmsReportCardDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsNumber()
  @IsOptional()
  attendance?: number;
}

export class CreateExamScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class CreateExamRoomDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @IsNotEmpty()
  capacity: number;
}

export class GenerateSeatingDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;
}

export class CreateInvigilatorDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;
}

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class CreateQuestionDto {
  @IsIn(['MCQ', 'DESCRIPTIVE', 'PRACTICAL'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  bloomLevel?: string;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  @IsOptional()
  difficulty?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];

  @IsString()
  @IsOptional()
  correctOptionId?: string;

  @IsNumber()
  @IsOptional()
  marks?: number;
}

export class CreateQuestionPaperDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsNumber()
  @IsNotEmpty()
  totalMarks: number;

  @IsInt()
  @IsNotEmpty()
  durationMin: number;
}

export class AddQuestionPaperItemDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsNumber()
  @IsOptional()
  marks?: number;
}

export class ActivateOnlineScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  questionPaperId: string;

  @IsInt()
  @IsOptional()
  durationMin?: number;
}

export class SaveAnswerDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class GenerateAttemptsDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;
}

export class UpdateEvaluationDto {
  @IsNumber()
  @IsNotEmpty()
  marksObtained: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateModerationDto {
  @IsUUID()
  @IsNotEmpty()
  moderatorId: string;

  @IsNumber()
  @IsNotEmpty()
  graceMarks: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GradeRangeDto {
  @IsNumber()
  @IsNotEmpty()
  min: number;

  @IsNumber()
  @IsNotEmpty()
  max: number;

  @IsString()
  @IsNotEmpty()
  grade: string;
}

export class CreateGradingSchemeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges: GradeRangeDto[];
}

export class ComputeResultsDto {
  @IsUUID()
  @IsOptional()
  gradingSchemeId?: string;
}
