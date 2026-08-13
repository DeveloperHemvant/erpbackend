import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './repositories/attendance.repository';
import { CommunicationService } from '../communication/communication.service';
import type { TenantContext } from '../prisma/tenant-context';

describe('AttendanceService — Campus Isolation Phase 3, Milestone 7', () => {
  let service: AttendanceService;

  const mockRepo = {
    findCampus: jest.fn(),
    findEnrollmentCampusId: jest.fn(),
    findStaffCampusId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    summaryBySection: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockCommService = { sendAbsenceAlert: jest.fn() };

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: AttendanceRepository, useValue: mockRepo },
        { provide: CommunicationService, useValue: mockCommService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('logAttendance — two-path campusId derivation', () => {
    it('derives campusId from the enrollment when enrollmentId is set', async () => {
      mockRepo.findEnrollmentCampusId.mockResolvedValue('campus-a');
      mockRepo.create.mockResolvedValue({ id: 'a1', status: 'Present', enrollment: null });

      await service.logAttendance(
        { enrollmentId: 'enr-1', date: '2026-08-13', status: 'Present' } as any,
        restricted,
      );

      expect(mockRepo.findStaffCampusId).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: 'campus-a' }),
      );
    });

    it('derives campusId from the staff record when staffId is set (self-attendance)', async () => {
      mockRepo.findStaffCampusId.mockResolvedValue('campus-b');
      mockRepo.create.mockResolvedValue({ id: 'a1', status: 'Present', enrollment: null });

      await service.logAttendance(
        { staffId: 'staff-9', date: '2026-08-13', status: 'Present' } as any,
        unrestricted,
      );

      expect(mockRepo.findEnrollmentCampusId).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: 'campus-b' }),
      );
    });

    it('rejects a restricted caller logging attendance for a different campus', async () => {
      mockRepo.findEnrollmentCampusId.mockResolvedValue('campus-b');

      await expect(
        service.logAttendance(
          { enrollmentId: 'enr-1', date: '2026-08-13', status: 'Present' } as any,
          restricted,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('allows a same-campus restricted caller', async () => {
      mockRepo.findEnrollmentCampusId.mockResolvedValue('campus-a');
      mockRepo.create.mockResolvedValue({ id: 'a1', status: 'Present', enrollment: null });

      await expect(
        service.logAttendance(
          { enrollmentId: 'enr-1', date: '2026-08-13', status: 'Present' } as any,
          restricted,
        ),
      ).resolves.toBeDefined();
    });

    it('sends an absence alert when the logged record is Absent for a student', async () => {
      mockRepo.findEnrollmentCampusId.mockResolvedValue('campus-a');
      mockCommService.sendAbsenceAlert.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue({
        id: 'a1',
        status: 'Absent',
        date: '2026-08-13',
        enrollment: { studentId: 'student-1' },
      });

      await service.logAttendance(
        { enrollmentId: 'enr-1', date: '2026-08-13', status: 'Absent' } as any,
        restricted,
      );

      expect(mockCommService.sendAbsenceAlert).toHaveBeenCalledWith(
        'student-1',
        '2026-08-13',
      );
    });
  });

  describe('getAttendance / getAttendanceSummary — threading', () => {
    it('threads tenantContext through to findMany', async () => {
      mockRepo.findMany.mockResolvedValue([]);
      await service.getAttendance(restricted, '2026-08-13');
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        { date: '2026-08-13' },
        restricted,
      );
    });

    it('threads tenantContext through to summaryBySection', async () => {
      mockRepo.summaryBySection.mockResolvedValue([]);
      await service.getAttendanceSummary('section-1', restricted);
      expect(mockRepo.summaryBySection).toHaveBeenCalledWith(
        'section-1',
        restricted,
      );
    });
  });

  describe('updateAttendance / deleteAttendance — ownership check', () => {
    it('updateAttendance 404s when the record belongs to a different campus', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'a1', campusId: 'campus-b' });
      await expect(
        service.updateAttendance('a1', { status: 'Present' } as any, restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('updateAttendance 404s for a genuinely missing id', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.updateAttendance('missing', { status: 'Present' } as any, unrestricted),
      ).rejects.toThrow(NotFoundException);
    });

    it('updateAttendance succeeds for a same-campus restricted caller', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'a1', campusId: 'campus-a' });
      mockRepo.update.mockResolvedValue({ id: 'a1', status: 'Present', enrollment: null });
      await expect(
        service.updateAttendance('a1', { status: 'Present' } as any, restricted),
      ).resolves.toBeDefined();
    });

    it('deleteAttendance 404s when the record belongs to a different campus', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'a1', campusId: 'campus-b' });
      await expect(
        service.deleteAttendance('a1', restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('deleteAttendance succeeds for canAccessAllCampuses regardless of campus', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'a1', campusId: 'campus-b' });
      mockRepo.delete.mockResolvedValue({ id: 'a1' });
      await expect(
        service.deleteAttendance('a1', unrestricted),
      ).resolves.toEqual({ id: 'a1' });
    });
  });
});
