import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';

describe('SearchRepository — Campus Isolation Phase 3, Milestone 1', () => {
  let repo: SearchRepository;

  const mockPrisma = {
    student: { findMany: jest.fn() },
    staff: { findMany: jest.fn() },
    transportVehicle: { findMany: jest.fn() },
    transportRoute: { findMany: jest.fn() },
    feeInvoice: { findMany: jest.fn() },
    admissionInquiry: { findMany: jest.fn() },
    disciplineIncident: { findMany: jest.fn() },
    section: { findMany: jest.fn() },
    parent: { findMany: jest.fn() },
    announcement: { findMany: jest.fn() },
    aCMSEvent: { findMany: jest.fn() },
    schoolHouse: { findMany: jest.fn() },
    libraryBook: { findMany: jest.fn() },
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Teacher',
    permissions: [],
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
    Object.values(mockPrisma).forEach((model) =>
      model.findMany.mockResolvedValue([]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<SearchRepository>(SearchRepository);
  });

  describe('directly-scopable models (own required/nullable campusId column)', () => {
    it('searchStaff filters by the caller\'s campusId when restricted', async () => {
      await repo.searchStaff('smith', 10, restricted);
      const where = mockPrisma.staff.findMany.mock.calls[0][0].where;
      expect(where.campusId).toBe('campus-a');
    });

    it('searchStaff applies no campusId filter for canAccessAllCampuses', async () => {
      await repo.searchStaff('smith', 10, unrestricted);
      const where = mockPrisma.staff.findMany.mock.calls[0][0].where;
      expect(where.campusId).toBeUndefined();
    });

    it('searchInvoices filters by campusId when restricted (nullable column, no requireCampusId needed)', async () => {
      await repo.searchInvoices('smith', 10, restricted);
      const where = mockPrisma.feeInvoice.findMany.mock.calls[0][0].where;
      expect(where.campusId).toBe('campus-a');
    });

    it('searchEvents filters by campusId when restricted', async () => {
      await repo.searchEvents('smith', 10, restricted);
      const where = mockPrisma.aCMSEvent.findMany.mock.calls[0][0].where;
      expect(where.campusId).toBe('campus-a');
    });
  });

  describe('relation-derivable models', () => {
    it('searchClassSections filters via class.campusId when restricted', async () => {
      await repo.searchClassSections('grade', 10, restricted);
      const where = mockPrisma.section.findMany.mock.calls[0][0].where;
      expect(where.class).toEqual({ campusId: 'campus-a' });
    });

    it('searchClassSections applies no class filter for canAccessAllCampuses', async () => {
      await repo.searchClassSections('grade', 10, unrestricted);
      const where = mockPrisma.section.findMany.mock.calls[0][0].where;
      expect(where.class).toBeUndefined();
    });

    it('searchStudents filters via enrollments.some.campusId when restricted', async () => {
      await repo.searchStudents('smith', 10, restricted);
      const where = mockPrisma.student.findMany.mock.calls[0][0].where;
      expect(where.enrollments).toEqual({ some: { campusId: 'campus-a' } });
    });

    it('searchDisciplineCases filters via student.enrollments.some.campusId when restricted', async () => {
      await repo.searchDisciplineCases('fight', 10, restricted);
      const where = mockPrisma.disciplineIncident.findMany.mock.calls[0][0].where;
      expect(where.student).toEqual({
        enrollments: { some: { campusId: 'campus-a' } },
      });
    });
  });

  describe('no-derivable-path models (hidden from campus-restricted staff)', () => {
    const cases: Array<[string, keyof typeof mockPrisma, () => Promise<any>]> = [
      ['searchVehicles', 'transportVehicle', () => repo.searchVehicles('x', 10, restricted)],
      ['searchRoutes', 'transportRoute', () => repo.searchRoutes('x', 10, restricted)],
      ['searchApplicants', 'admissionInquiry', () => repo.searchApplicants('x', 10, restricted)],
      ['searchAnnouncements', 'announcement', () => repo.searchAnnouncements('x', 10, restricted)],
      ['searchHouses', 'schoolHouse', () => repo.searchHouses('x', 10, restricted)],
      ['searchLibraryBooks', 'libraryBook', () => repo.searchLibraryBooks('x', 10, restricted)],
    ];

    it.each(cases)(
      '%s returns [] and never touches Prisma for a campus-restricted caller',
      async (_name, model, call) => {
        const result = await call();
        expect(result).toEqual([]);
        expect(mockPrisma[model].findMany).not.toHaveBeenCalled();
      },
    );

    it('searchVehicles queries normally for canAccessAllCampuses', async () => {
      await repo.searchVehicles('x', 10, unrestricted);
      expect(mockPrisma.transportVehicle.findMany).toHaveBeenCalled();
    });

    it('searchAnnouncements queries normally for canAccessAllCampuses', async () => {
      await repo.searchAnnouncements('x', 10, unrestricted);
      expect(mockPrisma.announcement.findMany).toHaveBeenCalled();
    });
  });

  describe('searchParents — never campus-filtered (D2)', () => {
    it('takes no tenantContext parameter and applies no campus filter', async () => {
      await repo.searchParents('smith', 10);
      const where = mockPrisma.parent.findMany.mock.calls[0][0].where;
      expect(where.campusId).toBeUndefined();
      expect(where.enrollments).toBeUndefined();
    });
  });

  describe('requireCampusId invariant enforcement', () => {
    it('throws instead of silently unfiltering if campusId is ever null while canAccessAllCampuses is false', async () => {
      const brokenInvariant: TenantContext = {
        ...restricted,
        campusId: null, // should never happen per D3 — proves the fail-loud path
      };
      await expect(repo.searchStaff('smith', 10, brokenInvariant)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
