import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';

describe('AttendanceRepository — Campus Isolation Phase 3, Milestone 7', () => {
  let repo: AttendanceRepository;

  const mockPrisma = {
    studentEnrollment: { findUnique: jest.fn() },
    staff: { findUnique: jest.fn() },
    attendanceRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Teacher',
    permissions: ['MARK_ATTENDANCE'],
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
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.groupBy.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<AttendanceRepository>(AttendanceRepository);
  });

  describe('findEnrollmentCampusId / findStaffCampusId', () => {
    it('returns the enrollment campusId', async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        campusId: 'campus-a',
      });
      const result = await repo.findEnrollmentCampusId('enr-1');
      expect(result).toBe('campus-a');
      expect(mockPrisma.studentEnrollment.findUnique.mock.calls[0][0]).toEqual({
        where: { id: 'enr-1' },
        select: { campusId: true },
      });
    });

    it('returns null when the enrollment does not exist', async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue(null);
      expect(await repo.findEnrollmentCampusId('missing')).toBeNull();
    });

    it('returns the staff campusId', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-b' });
      const result = await repo.findStaffCampusId('staff-1');
      expect(result).toBe('campus-b');
    });
  });

  describe('findMany', () => {
    it('merges the campus filter into the passed where when restricted', async () => {
      await repo.findMany({ date: '2026-08-13' }, restricted);
      expect(mockPrisma.attendanceRecord.findMany.mock.calls[0][0].where).toEqual({
        date: '2026-08-13',
        campusId: 'campus-a',
      });
    });

    it('leaves the where untouched for canAccessAllCampuses', async () => {
      await repo.findMany({ date: '2026-08-13' }, unrestricted);
      expect(mockPrisma.attendanceRecord.findMany.mock.calls[0][0].where).toEqual({
        date: '2026-08-13',
      });
    });

    it('throws instead of silently unfiltering if campusId is null while restricted', () => {
      const broken: TenantContext = { ...restricted, campusId: null };
      expect(() => repo.findMany({}, broken)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('summaryBySection', () => {
    it('adds the class-campus relation filter when restricted', async () => {
      await repo.summaryBySection('section-1', restricted);
      expect(mockPrisma.attendanceRecord.groupBy.mock.calls[0][0].where).toEqual({
        enrollment: {
          sectionId: 'section-1',
          section: { class: { campusId: 'campus-a' } },
        },
      });
    });

    it('applies only sectionId for canAccessAllCampuses', async () => {
      await repo.summaryBySection('section-1', unrestricted);
      expect(mockPrisma.attendanceRecord.groupBy.mock.calls[0][0].where).toEqual({
        enrollment: { sectionId: 'section-1' },
      });
    });
  });

  describe('findById', () => {
    it('selects only id and campusId', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({
        id: 'a1',
        campusId: 'campus-a',
      });
      const result = await repo.findById('a1');
      expect(result).toEqual({ id: 'a1', campusId: 'campus-a' });
      expect(mockPrisma.attendanceRecord.findUnique.mock.calls[0][0]).toEqual({
        where: { id: 'a1' },
        select: { id: true, campusId: true },
      });
    });
  });
});
