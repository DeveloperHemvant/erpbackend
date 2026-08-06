import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { SearchRepository } from './repositories/search.repository';

describe('SearchService', () => {
  let service: SearchService;

  const mockRepository = {
    searchStudents: jest.fn(),
    searchStaff: jest.fn(),
    searchVehicles: jest.fn(),
    searchRoutes: jest.fn(),
    searchInvoices: jest.fn(),
    searchApplicants: jest.fn(),
    searchDisciplineCases: jest.fn(),
    searchClassSections: jest.fn(),
    searchParents: jest.fn(),
    searchAnnouncements: jest.fn(),
    searchEvents: jest.fn(),
    searchHouses: jest.fn(),
    searchLibraryBooks: jest.fn(),
  };

  const superAdmin = {
    userId: 'u1',
    identifier: 'a',
    role: 'Admin',
    permissions: ['*'],
  };
  const teacherOnly = {
    userId: 'u2',
    identifier: 't',
    role: 'Teacher',
    permissions: ['VIEW_STUDENTS'],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.values(mockRepository).forEach((fn) => fn.mockResolvedValue([]));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: SearchRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns empty results for a query shorter than 2 characters', async () => {
    const result = await service.search('a', teacherOnly);

    expect(result).toEqual([]);
    expect(mockRepository.searchStudents).not.toHaveBeenCalled();
  });

  it('queries every entity type for a super admin (wildcard permission)', async () => {
    await service.search('smith', superAdmin);

    expect(mockRepository.searchStudents).toHaveBeenCalled();
    expect(mockRepository.searchStaff).toHaveBeenCalled();
    expect(mockRepository.searchVehicles).toHaveBeenCalled();
    expect(mockRepository.searchParents).toHaveBeenCalled();
  });

  it('only queries entity types the caller has view permission for', async () => {
    await service.search('smith', teacherOnly);

    expect(mockRepository.searchStudents).toHaveBeenCalled();
    expect(mockRepository.searchStaff).not.toHaveBeenCalled();
    expect(mockRepository.searchVehicles).not.toHaveBeenCalled();
  });

  it('sorts merged results by updatedAt descending and caps at the limit', async () => {
    mockRepository.searchStudents.mockResolvedValue([
      {
        id: 's1',
        entityType: 'student',
        title: 'Older',
        href: '/students/s1',
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 's2',
        entityType: 'student',
        title: 'Newer',
        href: '/students/s2',
        updatedAt: new Date('2026-06-01'),
      },
    ]);

    const result = await service.search('smith', teacherOnly, 1);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });
});
