import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { StudentRepository } from './student.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';

describe('StudentRepository — Campus Isolation Phase 3, Milestone 5', () => {
  let repo: StudentRepository;

  const mockPrisma = {
    student: { findMany: jest.fn(), count: jest.fn() },
    studentEnrollment: { findMany: jest.fn() },
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Teacher',
    permissions: ['VIEW_STUDENTS'],
    campusId: 'campus-a',
    canAccessAllCampuses: false,
    academicSessionId: 'session-1',
  };
  const unrestricted: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);
    mockPrisma.studentEnrollment.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<StudentRepository>(StudentRepository);
  });

  describe('findAll', () => {
    it('adds an enrollment-campus filter when restricted', async () => {
      await repo.findAll(restricted);
      expect(mockPrisma.student.findMany.mock.calls[0][0].where).toEqual({
        AND: [{ enrollments: { some: { campusId: 'campus-a' } } }],
      });
    });

    it('applies no campus filter for canAccessAllCampuses', async () => {
      await repo.findAll(unrestricted);
      expect(mockPrisma.student.findMany.mock.calls[0][0].where).toBeUndefined();
    });

    it('combines the campus filter with sectionId/search clauses', async () => {
      await repo.findAll(restricted, 'section-1', 'aarav');
      expect(mockPrisma.student.findMany.mock.calls[0][0].where).toEqual({
        AND: [
          { enrollments: { some: { sectionId: 'section-1' } } },
          {
            OR: [
              { fullName: { contains: 'aarav', mode: 'insensitive' } },
              { admissionNumber: { contains: 'aarav', mode: 'insensitive' } },
            ],
          },
          { enrollments: { some: { campusId: 'campus-a' } } },
        ],
      });
    });

    it('throws instead of silently unfiltering if campusId is null while restricted', () => {
      const broken: TenantContext = { ...restricted, campusId: null };
      expect(() => repo.findAll(broken)).toThrow(InternalServerErrorException);
    });
  });

  describe('findPage / count', () => {
    it('findPage applies the same campus filter as findAll', async () => {
      await repo.findPage(0, 20, restricted);
      expect(mockPrisma.student.findMany.mock.calls[0][0].where).toEqual({
        AND: [{ enrollments: { some: { campusId: 'campus-a' } } }],
      });
    });

    it('count applies the same campus filter as findAll', async () => {
      await repo.count(restricted);
      expect(mockPrisma.student.count.mock.calls[0][0].where).toEqual({
        AND: [{ enrollments: { some: { campusId: 'campus-a' } } }],
      });
    });
  });

  describe('findEnrollmentCampusIds', () => {
    it('returns the campusId of every enrollment for the student', async () => {
      mockPrisma.studentEnrollment.findMany.mockResolvedValue([
        { campusId: 'campus-a' },
        { campusId: null },
      ]);
      const result = await repo.findEnrollmentCampusIds('student-1');
      expect(result).toEqual(['campus-a', null]);
      expect(mockPrisma.studentEnrollment.findMany.mock.calls[0][0]).toEqual({
        where: { studentId: 'student-1' },
        select: { campusId: true },
      });
    });
  });
});
