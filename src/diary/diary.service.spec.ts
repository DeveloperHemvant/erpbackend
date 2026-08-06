import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from './diary.service';
import { DiaryRepository } from './repositories/diary.repository';

describe('DiaryService', () => {
  let service: DiaryService;

  const mockRepository = {
    createDiaryEntry: jest.fn(),
    findDiaryEntries: jest.fn(),
    updateDiaryEntry: jest.fn(),
    createNewsItem: jest.fn(),
    findNewsItems: jest.fn(),
    createLostFound: jest.fn(),
    findLostFound: jest.fn(),
    updateLostFound: jest.fn(),
    createDocLifecycle: jest.fn(),
    findDocLifecycles: jest.fn(),
    updateDocLifecycle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        { provide: DiaryRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DiaryService>(DiaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a diary entry', async () => {
    const dto = {
      studentId: 'student-uuid',
      type: 'REMARK',
      content: 'Complete page 12 of math book',
    };
    mockRepository.createDiaryEntry.mockResolvedValue({
      id: 'entry-uuid',
      ...dto,
    });

    const result = await service.createDiaryEntry('teacher-uuid', dto);
    expect(result.type).toBe('REMARK');
  });
});
