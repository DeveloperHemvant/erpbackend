import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { ActivitiesRepository } from './repositories/activities.repository';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockRepository = {
    createAssembly: jest.fn(),
    findAssemblies: jest.fn(),
    updateHousePoints: jest.fn(),
    findHouses: jest.fn(),
    createAchievement: jest.fn(),
    findAchievementsByStudent: jest.fn(),
    findAchievementById: jest.fn(),
    updateAchievement: jest.fn(),
    deleteAchievement: jest.fn(),
    createStaffDuty: jest.fn(),
    findStaffDuties: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: ActivitiesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a morning assembly log', async () => {
    const dto = {
      date: '2026-08-05T08:00:00.000Z',
      campusId: 'campus-uuid',
      theme: 'Honesty',
      performingSectionId: 'section-uuid',
      supervisingStaffId: 'staff-uuid',
      venue: 'Auditorium',
      activities: [],
    };
    mockRepository.createAssembly.mockResolvedValue({
      id: 'assembly-uuid',
      ...dto,
    });

    const result = await service.createAssembly(dto);
    expect(result.theme).toBe('Honesty');
  });

  it('updates an existing achievement', async () => {
    mockRepository.findAchievementById.mockResolvedValue({ id: 'ach-1' });
    mockRepository.updateAchievement.mockResolvedValue({
      id: 'ach-1',
      title: 'Updated Title',
    });

    const result = await service.updateAchievement('ach-1', {
      title: 'Updated Title',
    });

    expect(mockRepository.updateAchievement).toHaveBeenCalledWith('ach-1', {
      type: undefined,
      title: 'Updated Title',
      award: undefined,
    });
    expect(result.title).toBe('Updated Title');
  });

  it('throws NotFoundException when updating a missing achievement', async () => {
    mockRepository.findAchievementById.mockResolvedValue(null);

    await expect(
      service.updateAchievement('missing-id', { title: 'X' }),
    ).rejects.toThrow(NotFoundException);
    expect(mockRepository.updateAchievement).not.toHaveBeenCalled();
  });

  it('deletes an existing achievement', async () => {
    mockRepository.findAchievementById.mockResolvedValue({ id: 'ach-1' });
    mockRepository.deleteAchievement.mockResolvedValue({ id: 'ach-1' });

    await service.deleteAchievement('ach-1');

    expect(mockRepository.deleteAchievement).toHaveBeenCalledWith('ach-1');
  });

  it('throws NotFoundException when deleting a missing achievement', async () => {
    mockRepository.findAchievementById.mockResolvedValue(null);

    await expect(service.deleteAchievement('missing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.deleteAchievement).not.toHaveBeenCalled();
  });
});
