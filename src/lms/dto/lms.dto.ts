import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
}

export class CreateCurriculumDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  board?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateUnitDto {
  @IsUUID()
  @IsNotEmpty()
  curriculumId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateChapterDto {
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  learningOutcomes?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateTopicDto {
  @IsUUID()
  @IsNotEmpty()
  chapterId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  topicId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @IsOptional()
  durationMin?: number;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;
}

export class UploadResourceDto {
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsInt()
  @IsOptional()
  sizeBytes?: number;

  @IsUUID()
  @IsOptional()
  uploadedBy?: string;
}

export class CreateLmsAssignmentDto {
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  maxScore?: number;
}

export class CreateQuizDto {
  @IsUUID()
  @IsOptional()
  lessonId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  durationMin?: number;

  @IsNumber()
  @IsOptional()
  maxScore?: number;
}

export class CreateLiveClassDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  meetingUrl: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @IsOptional()
  durationMin?: number;

  @IsUUID()
  @IsOptional()
  hostId?: string;
}

export class SubmitAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}

export class GradeSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class UpsertGradeDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @IsNotEmpty()
  totalScore: number;

  @IsString()
  @IsOptional()
  letterGrade?: string;
}

export class CreateDiscussionThreadDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsOptional()
  authorId?: string;
}

export class CreateDiscussionPostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsOptional()
  authorId?: string;
}

export class AwardBadgeDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class LogAiGenerationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
