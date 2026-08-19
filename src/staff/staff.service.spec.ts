import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { TenantContext } from '../prisma/tenant-context';

describe('StaffService — Campus Isolation Phase 3, Milestone 5', () => {
  let service: StaffService;

  const mockPrisma = {
    staff: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    portalAccount: { findFirst: jest.fn(), update: jest.fn() },
    attendanceRecord: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leaveApplication: { create: jest.fn() },
    payrollStructure: { create: jest.fn() },
    teacherAssignment: { deleteMany: jest.fn(), createMany: jest.fn() },
    academicSession: { findFirst: jest.fn() },
    transportVehicleStaff: { deleteMany: jest.fn(), create: jest.fn() },
    transportTrip: { deleteMany: jest.fn(), create: jest.fn() },
    // create() wraps the staff row + optional PayrollStructure in a single
    // transaction (see staff.service.ts) — the mock transaction client is
    // just mockPrisma itself, since every model mock lives at this same
    // top level and the callback only ever calls tx.<model>.<method>.
    $transaction: jest.fn((callback: any) => callback(mockPrisma)),
  };

  const mockStorage = { uploadFile: jest.fn() };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'HR Admin',
    permissions: ['MANAGE_USERS'],
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  describe('create', () => {
    const dto = {
      email: 'new@school.test',
      fullName: 'New Staff',
      roleId: 'role-1',
    } as any;

    beforeEach(() => {
      mockPrisma.staff.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1' });
      mockPrisma.staff.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'new-staff', ...data }),
      );
    });

    it('defaults to the caller own campus when restricted and DTO omits campusId', async () => {
      const result = await service.create(dto, restricted);
      expect(mockPrisma.staff.create.mock.calls[0][0].data.campusId).toBe(
        'campus-a',
      );
      expect(result).toBeDefined();
    });

    it('rejects a restricted caller naming a different campus than their own', async () => {
      await expect(
        service.create({ ...dto, campusId: 'campus-b' }, restricted),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.staff.create).not.toHaveBeenCalled();
    });

    it('allows a restricted caller explicitly naming their own campus', async () => {
      await service.create({ ...dto, campusId: 'campus-a' }, restricted);
      expect(mockPrisma.staff.create.mock.calls[0][0].data.campusId).toBe(
        'campus-a',
      );
    });

    it('requires an explicit campusId when the caller can access all campuses', async () => {
      await expect(service.create(dto, unrestricted)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.staff.create).not.toHaveBeenCalled();
    });

    it('honors an explicit campusId from an unrestricted caller', async () => {
      await service.create({ ...dto, campusId: 'campus-b' }, unrestricted);
      expect(mockPrisma.staff.create.mock.calls[0][0].data.campusId).toBe(
        'campus-b',
      );
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.staff.findMany.mockResolvedValue([]);
      mockPrisma.staff.count.mockResolvedValue(0);
    });

    it('filters by campusId when restricted', async () => {
      await service.findAll(restricted);
      expect(mockPrisma.staff.findMany.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
      });
    });

    it('applies no filter for canAccessAllCampuses', async () => {
      await service.findAll(unrestricted);
      expect(mockPrisma.staff.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('applies the same where clause to the paginated count', async () => {
      await service.findAll(restricted, 1, 10);
      expect(mockPrisma.staff.count.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
      });
    });
  });

  describe('findOne', () => {
    it('returns the record when restricted caller matches its campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-a',
      });
      const result = await service.findOne('s1', restricted);
      expect(result.id).toBe('s1');
    });

    it('throws NotFoundException (not Forbidden) when restricted caller campus mismatches', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-b',
      });
      await expect(service.findOne('s1', restricted)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the record for canAccessAllCampuses regardless of campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-b',
      });
      const result = await service.findOne('s1', unrestricted);
      expect(result.id).toBe('s1');
    });

    it('throws NotFoundException for a genuinely missing id', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing', restricted)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update / remove / uploadPhoto — delegate to findOne for ownership', () => {
    it('update() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-b',
      });
      await expect(
        service.update('s1', {} as any, restricted),
      ).rejects.toThrow(NotFoundException);
    });

    it('remove() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-b',
      });
      await expect(service.remove('s1', restricted)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.staff.delete).not.toHaveBeenCalled();
    });

    it('uploadPhoto() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({
        id: 's1',
        campusId: 'campus-b',
      });
      await expect(
        service.uploadPhoto('s1', {} as any, restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockStorage.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('assertStaffAccessibleById-backed methods', () => {
    it('getAttendanceLogs() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-b' });
      await expect(
        service.getAttendanceLogs('s1', restricted),
      ).rejects.toThrow(NotFoundException);
    });

    it('applyLeave() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-b' });
      await expect(
        service.applyLeave('s1', {} as any, restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.leaveApplication.create).not.toHaveBeenCalled();
    });

    it('updateTeacherAssignments() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-b' });
      await expect(
        service.updateTeacherAssignments('s1', [], restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.teacherAssignment.deleteMany).not.toHaveBeenCalled();
    });

    it('updateTransportAssignments() 404s when the target belongs to a different campus', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-b' });
      await expect(
        service.updateTransportAssignments('s1', [], restricted),
      ).rejects.toThrow(NotFoundException);
      expect(
        mockPrisma.transportVehicleStaff.deleteMany,
      ).not.toHaveBeenCalled();
    });

    it('allows access for a same-campus restricted caller', async () => {
      mockPrisma.staff.findUnique.mockResolvedValue({ campusId: 'campus-a' });
      mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
      await expect(
        service.getAttendanceLogs('s1', restricted),
      ).resolves.toEqual([]);
    });
  });
});
