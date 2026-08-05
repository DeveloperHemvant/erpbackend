import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesService } from "./activities.service";
import { ActivitiesRepository } from "./repositories/activities.repository";

describe("ActivitiesService", () => {
  let service: ActivitiesService;

  const mockRepository = {
    createAssembly: jest.fn(),
    findAssemblies: jest.fn(),
    createSchoolEvent: jest.fn(),
    findSchoolEvents: jest.fn(),
    updateHousePoints: jest.fn(),
    findHouses: jest.fn(),
    createAchievement: jest.fn(),
    findAchievementsByStudent: jest.fn(),
    createStaffDuty: jest.fn(),
    findStaffDuties: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: ActivitiesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("creates a morning assembly log", async () => {
    const dto = {
      date: "2026-08-05T08:00:00.000Z",
      campusId: "campus-uuid",
      theme: "Honesty",
      performingSectionId: "section-uuid",
      supervisingStaffId: "staff-uuid",
      venue: "Auditorium",
      activities: [],
    };
    mockRepository.createAssembly.mockResolvedValue({ id: "assembly-uuid", ...dto });

    const result = await service.createAssembly(dto);
    expect(result.theme).toBe("Honesty");
  });
});
