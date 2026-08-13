import { Test, TestingModule } from '@nestjs/testing';
import { SubstitutionService } from './substitution.service';
import { SubstitutionRepository } from './repositories/substitution.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunicationService } from '../communication/communication.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubstitutionService', () => {
  let service: SubstitutionService;

  const mockRepository = {
    createSubstitution: jest.fn(),
    findSubstitutions: jest.fn(),
    findEnrolledStudentIdsInSection: jest.fn().mockResolvedValue([]),
  };

  const mockNotificationsService = {
    getTokensForUsers: jest.fn().mockResolvedValue([]),
    sendPushNotifications: jest.fn().mockResolvedValue(null),
  };

  const mockCommService = {
    sendCustomAlert: jest.fn().mockResolvedValue(null),
  };

  const mockPrismaService = {
    timetablePeriod: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    staff: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.findEnrolledStudentIdsInSection.mockResolvedValue([]);
    mockNotificationsService.getTokensForUsers.mockResolvedValue([]);
    mockNotificationsService.sendPushNotifications.mockResolvedValue(null);
    mockCommService.sendCustomAlert.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubstitutionService,
        { provide: SubstitutionRepository, useValue: mockRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: CommunicationService, useValue: mockCommService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SubstitutionService>(SubstitutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a teacher substitution entry', async () => {
    const dto = {
      leaveApplicationId: 'leave-uuid',
      primaryTeacherId: 'teacher1-uuid',
      substituteTeacherId: 'teacher2-uuid',
      date: '2026-08-05',
      timetablePeriodId: 'period-uuid',
    };
    mockRepository.createSubstitution.mockResolvedValue({
      id: 'sub-uuid',
      ...dto,
      date: new Date(dto.date),
      substituteTeacher: { id: 'teacher2-uuid', fullName: 'Ms. Rao' },
      primaryTeacher: { id: 'teacher1-uuid', fullName: 'Mr. Singh' },
      timetablePeriod: { startTime: '08:00', endTime: '08:45' },
    });

    const result = await service.createSubstitution(dto);
    expect(result.id).toBe('sub-uuid');
  });

  it('notifies each enrolled student\'s family in the affected section', async () => {
    const dto = {
      leaveApplicationId: 'leave-uuid',
      primaryTeacherId: 'teacher1-uuid',
      substituteTeacherId: 'teacher2-uuid',
      date: '2026-08-05',
      timetablePeriodId: 'period-uuid',
    };
    mockRepository.createSubstitution.mockResolvedValue({
      id: 'sub-uuid',
      ...dto,
      date: new Date(dto.date),
      substituteTeacher: { id: 'teacher2-uuid', fullName: 'Ms. Rao' },
      primaryTeacher: { id: 'teacher1-uuid', fullName: 'Mr. Singh' },
      timetablePeriod: {
        startTime: '08:00',
        endTime: '08:45',
        section: { id: 'section-1' },
        subject: { name: 'Mathematics' },
      },
    });
    mockRepository.findEnrolledStudentIdsInSection.mockResolvedValue([
      'student-1',
      'student-2',
    ]);

    await service.createSubstitution(dto);

    expect(mockRepository.findEnrolledStudentIdsInSection).toHaveBeenCalledWith(
      'section-1',
    );
    expect(mockCommService.sendCustomAlert).toHaveBeenCalledTimes(2);
    expect(mockCommService.sendCustomAlert).toHaveBeenCalledWith(
      'student-1',
      'Substitute Teacher Assigned',
      expect.stringContaining('Ms. Rao'),
    );
  });

  it('skips family notification when the period has no section on record', async () => {
    const dto = {
      leaveApplicationId: 'leave-uuid',
      primaryTeacherId: 'teacher1-uuid',
      substituteTeacherId: 'teacher2-uuid',
      date: '2026-08-05',
      timetablePeriodId: 'period-uuid',
    };
    mockRepository.createSubstitution.mockResolvedValue({
      id: 'sub-uuid',
      ...dto,
      date: new Date(dto.date),
      substituteTeacher: { id: 'teacher2-uuid', fullName: 'Ms. Rao' },
      primaryTeacher: { id: 'teacher1-uuid', fullName: 'Mr. Singh' },
      timetablePeriod: { startTime: '08:00', endTime: '08:45' },
    });

    await service.createSubstitution(dto);

    expect(mockRepository.findEnrolledStudentIdsInSection).not.toHaveBeenCalled();
    expect(mockCommService.sendCustomAlert).not.toHaveBeenCalled();
  });
});
