import { ApiProperty } from '@nestjs/swagger';

/** Refresh: 5 min. "Completion" = gradebook published (EMSGradebook.isPublished),
 * scoped to the active EMSExamSession — not "has ≥1 result entered," which
 * would count a barely-started gradebook as "complete." Redefinition from the
 * originally-assumed "% of scheduled exams with results" — EMSResult belongs
 * to a Gradebook (class+exam-session), not directly to an exam schedule, so
 * that literal formula doesn't map onto the real schema. See KPI_DEFINITIONS.md §3. */
export class ExamCompletionDto {
  @ApiProperty({ example: 42 })
  totalGradebooks: number;

  @ApiProperty({ example: 31 })
  publishedGradebooks: number;

  @ApiProperty({ example: 74 })
  completionRate: number;
}

export class TeacherWorkloadItemDto {
  @ApiProperty() staffId: string;
  @ApiProperty({ example: 'Priya Nair' }) staffName: string;
  @ApiProperty({ example: 6 }) assignmentCount: number;
  @ApiProperty({ example: 24, description: 'Σ TeacherAssignment.hoursPerWeek, active-session assignments only' })
  hoursPerWeek: number;
}

/** Refresh: 5 min. Top 10 by hoursPerWeek, active AcademicSession only. */
export class TeacherWorkloadDto {
  @ApiProperty({ type: [TeacherWorkloadItemDto] })
  teachers: TeacherWorkloadItemDto[];
}

export class PromotionReadinessByClassDto {
  @ApiProperty({ example: 'clx1234567890' }) classId: string;
  @ApiProperty({ example: 'Grade 5' }) grade: string;
  @ApiProperty({ example: 42 }) totalStudents: number;
  @ApiProperty({ example: 38 }) passing: number;
  @ApiProperty({ example: 4 }) failing: number;
}

/** Refresh: on section expand (reuses PromotionsService.preview — a real,
 * already-existing, read-only computation — against the active
 * AcademicSession's default 40% pass threshold). `available: false` when
 * there's no active session, rather than fabricating zeros as if a real
 * computation happened. */
export class PromotionReadinessDto {
  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ example: '2026-2027', nullable: true })
  sessionName: string | null;

  @ApiProperty({ example: 40, nullable: true })
  passThreshold: number | null;

  @ApiProperty({ example: 4820 })
  totalStudents: number;

  @ApiProperty({ example: 4510 })
  passing: number;

  @ApiProperty({ example: 310 })
  failing: number;

  @ApiProperty({ example: 94 })
  readinessRate: number;

  @ApiProperty({ type: [PromotionReadinessByClassDto] })
  byClass: PromotionReadinessByClassDto[];
}
