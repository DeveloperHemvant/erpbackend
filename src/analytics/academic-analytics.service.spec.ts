import { Test, TestingModule } from '@nestjs/testing';
import { AcademicAnalyticsService } from './academic-analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { StudentRepository } from '../students/repositories/student.repository';
import { PromotionsService } from '../promotions/promotions.service';

describe('AcademicAnalyticsService', () => {
  let service: AcademicAnalyticsService;

  const mockRepo = {
    countGradebooks: jest.fn(),
    findActiveTeacherAssignments: jest.fn(),
  };
  const mockStudentRepository = {
    findActiveAcademicSession: jest.fn(),
  };
  const mockPromotionsService = {
    preview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicAnalyticsService,
        { provide: AnalyticsRepository, useValue: mockRepo },
        { provide: StudentRepository, useValue: mockStudentRepository },
        { provide: PromotionsService, useValue: mockPromotionsService },
      ],
    }).compile();

    service = module.get<AcademicAnalyticsService>(AcademicAnalyticsService);
  });

  describe('getExamCompletion', () => {
    it('computes completionRate from published ÷ total gradebooks', async () => {
      mockRepo.countGradebooks.mockImplementation(
        (_activeOnly: boolean, published?: boolean) =>
          Promise.resolve(published ? 31 : 42),
      );

      const result = await service.getExamCompletion();

      expect(result.totalGradebooks).toBe(42);
      expect(result.publishedGradebooks).toBe(31);
      expect(result.completionRate).toBe(74); // round(31/42*100)
    });

    it('scopes both counts to the active exam session', async () => {
      mockRepo.countGradebooks.mockResolvedValue(0);
      await service.getExamCompletion();
      expect(mockRepo.countGradebooks).toHaveBeenNthCalledWith(1, true);
      expect(mockRepo.countGradebooks).toHaveBeenNthCalledWith(2, true, true);
    });

    it('returns 0% rather than dividing by zero when there are no gradebooks yet', async () => {
      mockRepo.countGradebooks.mockResolvedValue(0);
      const result = await service.getExamCompletion();
      expect(result.completionRate).toBe(0);
    });
  });

  describe('getTeacherWorkload', () => {
    it('groups assignments by staff, summing hours and counting assignments', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      mockRepo.findActiveTeacherAssignments.mockResolvedValue([
        { staffId: 't1', hoursPerWeek: 10, subjectId: 's1', sectionId: 'sec1', staff: { fullName: 'Priya Nair' } },
        { staffId: 't1', hoursPerWeek: 6, subjectId: 's2', sectionId: 'sec2', staff: { fullName: 'Priya Nair' } },
        { staffId: 't2', hoursPerWeek: 4, subjectId: 's1', sectionId: 'sec1', staff: { fullName: 'Ravi Kumar' } },
      ]);

      const result = await service.getTeacherWorkload();

      expect(result.teachers).toEqual([
        { staffId: 't1', staffName: 'Priya Nair', assignmentCount: 2, hoursPerWeek: 16 },
        { staffId: 't2', staffName: 'Ravi Kumar', assignmentCount: 1, hoursPerWeek: 4 },
      ]);
    });

    it('sorts descending by hoursPerWeek and caps at the top 10', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      const assignments = Array.from({ length: 15 }, (_, i) => ({
        staffId: `t${i}`,
        hoursPerWeek: i, // t14 has the most hours (14), t0 the least (0)
        subjectId: 's1',
        sectionId: 'sec1',
        staff: { fullName: `Teacher ${i}` },
      }));
      mockRepo.findActiveTeacherAssignments.mockResolvedValue(assignments);

      const result = await service.getTeacherWorkload();

      expect(result.teachers).toHaveLength(10);
      expect(result.teachers[0].staffId).toBe('t14');
      expect(result.teachers[9].staffId).toBe('t5');
    });

    it('treats a missing hoursPerWeek as 0 rather than producing NaN', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      mockRepo.findActiveTeacherAssignments.mockResolvedValue([
        { staffId: 't1', hoursPerWeek: null, subjectId: 's1', sectionId: 'sec1', staff: { fullName: 'Priya Nair' } },
      ]);

      const result = await service.getTeacherWorkload();
      expect(result.teachers[0].hoursPerWeek).toBe(0);
    });

    it('returns an empty list rather than throwing when there is no active session', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue(null);
      const result = await service.getTeacherWorkload();
      expect(result.teachers).toEqual([]);
      expect(mockRepo.findActiveTeacherAssignments).not.toHaveBeenCalled();
    });
  });

  describe('getPromotionReadiness', () => {
    it('aggregates passing/failing across all classes from PromotionsService.preview', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      mockPromotionsService.preview.mockResolvedValue({
        fromSessionId: 'sess-1',
        passThreshold: 40,
        classes: [
          { classId: 'c1', grade: 'Grade 5', nextGrade: 'Grade 6', isFinalGrade: false, totalStudents: 40, passing: 38, failing: 2, failingStudents: [] },
          { classId: 'c2', grade: 'Grade 6', nextGrade: 'Grade 7', isFinalGrade: false, totalStudents: 35, passing: 30, failing: 5, failingStudents: [] },
        ],
      });

      const result = await service.getPromotionReadiness();

      expect(result.available).toBe(true);
      expect(result.sessionName).toBe('2026-2027');
      expect(result.totalStudents).toBe(75);
      expect(result.passing).toBe(68);
      expect(result.failing).toBe(7);
      expect(result.readinessRate).toBe(91); // round(68/75*100)
      expect(result.byClass).toEqual([
        { grade: 'Grade 5', totalStudents: 40, passing: 38, failing: 2 },
        { grade: 'Grade 6', totalStudents: 35, passing: 30, failing: 5 },
      ]);
    });

    it('does not leak per-student failingStudents detail into the dashboard summary', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      mockPromotionsService.preview.mockResolvedValue({
        fromSessionId: 'sess-1',
        passThreshold: 40,
        classes: [
          {
            classId: 'c1',
            grade: 'Grade 5',
            nextGrade: 'Grade 6',
            isFinalGrade: false,
            totalStudents: 1,
            passing: 0,
            failing: 1,
            failingStudents: [{ studentId: 's1', enrollmentId: 'e1', fullName: 'A Student', percentage: 12 }],
          },
        ],
      });

      const result = await service.getPromotionReadiness();
      expect((result.byClass[0] as any).failingStudents).toBeUndefined();
    });

    it('returns available:false rather than fabricating a readiness number when there is no active session', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue(null);
      const result = await service.getPromotionReadiness();

      expect(result.available).toBe(false);
      expect(result.sessionName).toBeNull();
      expect(result.totalStudents).toBe(0);
      expect(result.readinessRate).toBe(0);
      expect(mockPromotionsService.preview).not.toHaveBeenCalled();
    });

    it('returns 0% readiness rather than dividing by zero when the active session has no enrolled students', async () => {
      mockStudentRepository.findActiveAcademicSession.mockResolvedValue({ id: 'sess-1', name: '2026-2027' });
      mockPromotionsService.preview.mockResolvedValue({ fromSessionId: 'sess-1', passThreshold: 40, classes: [] });

      const result = await service.getPromotionReadiness();
      expect(result.readinessRate).toBe(0);
      expect(result.available).toBe(true);
    });
  });
});
