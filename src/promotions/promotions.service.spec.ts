import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PromotionsService', () => {
  let service: PromotionsService;

  const mockPrisma = {
    class: { findMany: jest.fn() },
    reportCard: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe('preview', () => {
    it('batches report-card lookups into a single query instead of one per enrollment', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'c1',
          grade: 'Grade 5',
          campusId: 'campus1',
          sections: [
            {
              enrollments: [
                { id: 'e1', studentId: 's1', rollNumber: 1, student: { fullName: 'A' } },
                { id: 'e2', studentId: 's2', rollNumber: 2, student: { fullName: 'B' } },
              ],
            },
          ],
        },
      ]);
      mockPrisma.reportCard.findMany.mockResolvedValue([]);

      await service.preview({ fromSessionId: 'sess1' });

      // Exactly one batched call, not one per enrollment.
      expect(mockPrisma.reportCard.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reportCard.findMany).toHaveBeenCalledWith({
        where: { enrollmentId: { in: ['e1', 'e2'] }, exam: { sessionId: 'sess1' } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('defaults to passed when a student has no report card at all', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'c1',
          grade: 'Grade 5',
          campusId: 'campus1',
          sections: [{ enrollments: [{ id: 'e1', studentId: 's1', rollNumber: 1, student: { fullName: 'A' } }] }],
        },
      ]);
      mockPrisma.reportCard.findMany.mockResolvedValue([]);

      const result = await service.preview({ fromSessionId: 'sess1' });

      expect(result.classes[0].passing).toBe(1);
      expect(result.classes[0].failing).toBe(0);
    });

    it('picks the latest report card per enrollment when several exist', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'c1',
          grade: 'Grade 5',
          campusId: 'campus1',
          sections: [{ enrollments: [{ id: 'e1', studentId: 's1', rollNumber: 1, student: { fullName: 'A' } }] }],
        },
      ]);
      // findMany is ordered createdAt desc by the query itself — the first
      // row per enrollmentId in this mocked array IS "the latest" from the
      // service's point of view, matching what the real ORDER BY would hand it.
      mockPrisma.reportCard.findMany.mockResolvedValue([
        { enrollmentId: 'e1', computedData: { percentage: '85' }, gpa: '8.5', createdAt: new Date('2026-06-01') },
        { enrollmentId: 'e1', computedData: { percentage: '10' }, gpa: '1.0', createdAt: new Date('2026-01-01') },
      ]);

      const result = await service.preview({ fromSessionId: 'sess1', passThreshold: 40 });

      expect(result.classes[0].passing).toBe(1); // uses 85%, not the older 10%
    });

    it('falls back to gpa×10 when computedData.percentage is absent', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'c1',
          grade: 'Grade 5',
          campusId: 'campus1',
          sections: [{ enrollments: [{ id: 'e1', studentId: 's1', rollNumber: 1, student: { fullName: 'A' } }] }],
        },
      ]);
      mockPrisma.reportCard.findMany.mockResolvedValue([
        { enrollmentId: 'e1', computedData: null, gpa: '3.0', createdAt: new Date() }, // 3.0 * 10 = 30%
      ]);

      const result = await service.preview({ fromSessionId: 'sess1', passThreshold: 40 });

      expect(result.classes[0].failing).toBe(1); // 30% < 40% threshold
      expect(result.classes[0].failingStudents[0].percentage).toBe(30);
    });

    it('respects the pass threshold at the boundary (>= passes, < fails)', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'c1',
          grade: 'Grade 5',
          campusId: 'campus1',
          sections: [{ enrollments: [{ id: 'e1', studentId: 's1', rollNumber: 1, student: { fullName: 'A' } }] }],
        },
      ]);
      mockPrisma.reportCard.findMany.mockResolvedValue([
        { enrollmentId: 'e1', computedData: { percentage: '40' }, gpa: null, createdAt: new Date() },
      ]);

      const result = await service.preview({ fromSessionId: 'sess1', passThreshold: 40 });
      expect(result.classes[0].passing).toBe(1); // exactly at threshold passes
    });

    it('correctly labels the final grade with no next grade', async () => {
      mockPrisma.class.findMany.mockResolvedValue([
        { id: 'c1', grade: 'Grade 12', campusId: 'campus1', sections: [] },
      ]);
      mockPrisma.reportCard.findMany.mockResolvedValue([]);

      const result = await service.preview({ fromSessionId: 'sess1' });
      expect(result.classes[0].nextGrade).toBeNull();
      expect(result.classes[0].isFinalGrade).toBe(true);
    });
  });
});
