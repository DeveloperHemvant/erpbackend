import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { StudentRepository } from '../students/repositories/student.repository';
import { PromotionsService } from '../promotions/promotions.service';
import type {
  ExamCompletionDto,
  TeacherWorkloadDto,
  PromotionReadinessDto,
} from './dto/academic-analytics.dto';

const TEACHER_WORKLOAD_TOP_N = 10;
const DEFAULT_PROMOTION_PASS_THRESHOLD = 40;

@Injectable()
export class AcademicAnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly studentRepository: StudentRepository,
    private readonly promotionsService: PromotionsService,
  ) {}

  async getExamCompletion(): Promise<ExamCompletionDto> {
    const [totalGradebooks, publishedGradebooks] = await Promise.all([
      this.repo.countGradebooks(true),
      this.repo.countGradebooks(true, true),
    ]);

    return {
      totalGradebooks,
      publishedGradebooks,
      completionRate:
        totalGradebooks > 0
          ? Math.round((publishedGradebooks / totalGradebooks) * 100)
          : 0,
    };
  }

  async getTeacherWorkload(): Promise<TeacherWorkloadDto> {
    const activeSession = await this.studentRepository.findActiveAcademicSession();
    if (!activeSession) return { teachers: [] };

    const assignments = await this.repo.findActiveTeacherAssignments(activeSession.id);

    const byStaff = new Map<
      string,
      { staffName: string; assignmentCount: number; hoursPerWeek: number }
    >();
    for (const a of assignments) {
      const bucket = byStaff.get(a.staffId) ?? {
        staffName: a.staff.fullName,
        assignmentCount: 0,
        hoursPerWeek: 0,
      };
      bucket.assignmentCount += 1;
      bucket.hoursPerWeek += a.hoursPerWeek ?? 0;
      byStaff.set(a.staffId, bucket);
    }

    const teachers = Array.from(byStaff.entries())
      .map(([staffId, v]) => ({ staffId, ...v }))
      .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)
      .slice(0, TEACHER_WORKLOAD_TOP_N);

    return { teachers };
  }

  /** Reuses PromotionsService.preview() — a real, already-existing, read-only
   * (no writes) computation — rather than reimplementing the pass/fail logic.
   * Scoped to the active AcademicSession automatically; no class/section
   * selection required, unlike the admin Promotions screen's own flow. */
  async getPromotionReadiness(): Promise<PromotionReadinessDto> {
    const activeSession = await this.studentRepository.findActiveAcademicSession();
    if (!activeSession) {
      return {
        available: false,
        sessionName: null,
        passThreshold: null,
        totalStudents: 0,
        passing: 0,
        failing: 0,
        readinessRate: 0,
        byClass: [],
      };
    }

    const preview = await this.promotionsService.preview({
      fromSessionId: activeSession.id,
      passThreshold: DEFAULT_PROMOTION_PASS_THRESHOLD,
    });

    const byClass = preview.classes.map((c) => ({
      grade: c.grade,
      totalStudents: c.totalStudents,
      passing: c.passing,
      failing: c.failing,
    }));

    const totalStudents = byClass.reduce((s, c) => s + c.totalStudents, 0);
    const passing = byClass.reduce((s, c) => s + c.passing, 0);
    const failing = byClass.reduce((s, c) => s + c.failing, 0);

    return {
      available: true,
      sessionName: activeSession.name,
      passThreshold: preview.passThreshold,
      totalStudents,
      passing,
      failing,
      readinessRate: totalStudents > 0 ? Math.round((passing / totalStudents) * 100) : 0,
      byClass,
    };
  }
}
