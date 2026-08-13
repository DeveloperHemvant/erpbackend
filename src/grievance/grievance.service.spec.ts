import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GrievanceService } from './grievance.service';
import { GrievanceRepository } from './repositories/grievance.repository';
import { CommunicationService } from '../communication/communication.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('GrievanceService', () => {
  let service: GrievanceService;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByReporter: jest.fn(),
    findByAssignee: jest.fn(),
    update: jest.fn(),
  };

  const mockCommService = {
    notifyGrievanceAssigned: jest.fn(),
    notifyGrievanceResolved: jest.fn(),
  };

  const staffUser: AuthenticatedUser = {
    userId: 'staff-1',
    identifier: 'teacher@school.edu',
    role: 'Teacher',
    permissions: [],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };

  const managerUser: AuthenticatedUser = {
    userId: 'admin-1',
    identifier: 'admin@school.edu',
    role: 'Vice Principal',
    permissions: ['MANAGE_GRIEVANCES'],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };

  const studentUser: AuthenticatedUser = {
    userId: 'student-1',
    identifier: 'student@school.edu',
    role: 'Student',
    permissions: [],
    campusId: null,
    canAccessAllCampuses: false,
  };

  const parentUser: AuthenticatedUser = {
    userId: 'parent-1',
    identifier: 'parent@school.edu',
    role: 'Parent',
    permissions: [],
    campusId: null,
    canAccessAllCampuses: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCommService.notifyGrievanceAssigned.mockResolvedValue(undefined);
    mockCommService.notifyGrievanceResolved.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievanceService,
        { provide: GrievanceRepository, useValue: mockRepository },
        { provide: CommunicationService, useValue: mockCommService },
      ],
    }).compile();

    service = module.get<GrievanceService>(GrievanceService);
  });

  describe('createGrievance', () => {
    it('files the grievance as the calling student, ignoring any client-supplied identity', async () => {
      mockRepository.create.mockResolvedValue({ id: 'g-1' });

      await service.createGrievance(
        { title: 'Noisy classroom', description: 'Too loud' },
        studentUser,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userType: 'STUDENT',
        reporterId: 'student-1',
        title: 'Noisy classroom',
        description: 'Too loud',
      });
    });

    it('derives PARENT userType for a parent role', async () => {
      mockRepository.create.mockResolvedValue({ id: 'g-1' });

      await service.createGrievance(
        { title: 'Bus delay', description: 'Late every day' },
        parentUser,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userType: 'PARENT', reporterId: 'parent-1' }),
      );
    });

    it('buckets every non-student/parent role as STAFF', async () => {
      mockRepository.create.mockResolvedValue({ id: 'g-1' });

      await service.createGrievance(
        { title: 'Staffroom AC broken', description: '...' },
        staffUser,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userType: 'STAFF', reporterId: 'staff-1' }),
      );
    });
  });

  describe('getMyGrievances / getAssignedToMe / getAllGrievances', () => {
    it('looks up the reporter queue by derived userType and caller id', async () => {
      mockRepository.findByReporter.mockResolvedValue([]);
      await service.getMyGrievances(studentUser);
      expect(mockRepository.findByReporter).toHaveBeenCalledWith(
        'STUDENT',
        'student-1',
      );
    });

    it('looks up the assignee queue by caller id', async () => {
      mockRepository.findByAssignee.mockResolvedValue([]);
      await service.getAssignedToMe(staffUser);
      expect(mockRepository.findByAssignee).toHaveBeenCalledWith('staff-1');
    });

    it('lists every grievance for the oversight queue', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      await service.getAllGrievances();
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getGrievance', () => {
    it('throws NotFoundException when the grievance does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.getGrievance('missing', staffUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows a MANAGE_GRIEVANCES holder regardless of ownership', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        userType: 'STUDENT',
        reporterId: 'someone-else',
        assignedToId: 'someone-else-too',
      });
      await expect(
        service.getGrievance('g-1', managerUser),
      ).resolves.toBeDefined();
    });

    it('allows the reporter to view their own grievance', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        userType: 'STUDENT',
        reporterId: 'student-1',
        assignedToId: null,
      });
      await expect(
        service.getGrievance('g-1', studentUser),
      ).resolves.toBeDefined();
    });

    it('allows the assigned staff member to view it', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        userType: 'STUDENT',
        reporterId: 'student-1',
        assignedToId: 'staff-1',
      });
      await expect(
        service.getGrievance('g-1', staffUser),
      ).resolves.toBeDefined();
    });

    it('denies an unrelated caller with no permission', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        userType: 'STUDENT',
        reporterId: 'student-1',
        assignedToId: 'some-other-staff',
      });
      await expect(service.getGrievance('g-1', staffUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('does not let a different STUDENT reporter view another student\'s grievance', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        userType: 'STUDENT',
        reporterId: 'other-student',
        assignedToId: null,
      });
      await expect(
        service.getGrievance('g-1', studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignGrievance', () => {
    it('throws NotFoundException when the grievance does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(
        service.assignGrievance('missing', 'staff-2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('assigns the grievance and notifies the new assignee', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 'Broken projector',
        escalationLevel: 0,
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1', assignedToId: 'staff-2' });

      const result = await service.assignGrievance('g-1', 'staff-2');

      expect(mockRepository.update).toHaveBeenCalledWith('g-1', {
        assignedToId: 'staff-2',
      });
      expect(mockCommService.notifyGrievanceAssigned).toHaveBeenCalledWith(
        'staff-2',
        'Broken projector',
      );
      expect(result).toEqual({ id: 'g-1', assignedToId: 'staff-2' });
    });
  });

  describe('escalateGrievance', () => {
    it('throws NotFoundException when the grievance does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(
        service.escalateGrievance('missing', {}, staffUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('denies escalation from a caller who is neither the assignee nor a manager', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 't',
        escalationLevel: 0,
        assignedToId: 'some-other-staff',
      });
      await expect(
        service.escalateGrievance('g-1', {}, staffUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('lets the assigned staff member escalate without holding MANAGE_GRIEVANCES', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 't',
        escalationLevel: 0,
        assignedToId: 'staff-1',
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1', escalationLevel: 1 });

      await service.escalateGrievance('g-1', {}, staffUser);

      expect(mockRepository.update).toHaveBeenCalledWith('g-1', {
        escalationLevel: 1,
        status: 'Escalated',
      });
    });

    it('reassigns and notifies the new assignee when reassignToId is given', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 'Unresolved dispute',
        escalationLevel: 1,
        assignedToId: 'staff-1',
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1' });

      await service.escalateGrievance(
        'g-1',
        { reassignToId: 'principal-1' },
        staffUser,
      );

      expect(mockRepository.update).toHaveBeenCalledWith('g-1', {
        escalationLevel: 2,
        status: 'Escalated',
        assignedToId: 'principal-1',
      });
      expect(mockCommService.notifyGrievanceAssigned).toHaveBeenCalledWith(
        'principal-1',
        'Unresolved dispute',
      );
    });

    it('allows a MANAGE_GRIEVANCES holder to escalate a grievance assigned to someone else', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 't',
        escalationLevel: 0,
        assignedToId: 'some-other-staff',
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1' });

      await expect(
        service.escalateGrievance('g-1', {}, managerUser),
      ).resolves.toBeDefined();
    });
  });

  describe('resolveGrievance', () => {
    it('throws NotFoundException when the grievance does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(
        service.resolveGrievance('missing', { status: 'Resolved' }, staffUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('denies resolution from a caller who is neither the assignee nor a manager', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 't',
        userType: 'STUDENT',
        reporterId: 'student-1',
        assignedToId: 'some-other-staff',
      });
      await expect(
        service.resolveGrievance('g-1', { status: 'Resolved' }, staffUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('resolves the grievance, stamps resolvedAt, and notifies the reporter', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 'Cafeteria hygiene',
        userType: 'PARENT',
        reporterId: 'parent-1',
        assignedToId: 'staff-1',
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1', status: 'Resolved' });

      await service.resolveGrievance(
        'g-1',
        { status: 'Resolved', resolutionRemarks: 'Kitchen re-inspected.' },
        staffUser,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        'g-1',
        expect.objectContaining({
          status: 'Resolved',
          resolutionRemarks: 'Kitchen re-inspected.',
          resolvedAt: expect.any(Date),
        }),
      );
      expect(mockCommService.notifyGrievanceResolved).toHaveBeenCalledWith(
        'PARENT',
        'parent-1',
        'Cafeteria hygiene',
        'Kitchen re-inspected.',
      );
    });

    it('allows a MANAGE_GRIEVANCES holder to resolve a grievance assigned to someone else', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'g-1',
        title: 't',
        userType: 'STAFF',
        reporterId: 'staff-9',
        assignedToId: 'some-other-staff',
      });
      mockRepository.update.mockResolvedValue({ id: 'g-1' });

      await expect(
        service.resolveGrievance('g-1', { status: 'Rejected' }, managerUser),
      ).resolves.toBeDefined();
    });
  });
});
