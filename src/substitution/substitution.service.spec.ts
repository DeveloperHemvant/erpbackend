import { Test, TestingModule } from "@nestjs/testing";
import { SubstitutionService } from "./substitution.service";
import { SubstitutionRepository } from "./repositories/substitution.repository";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

describe("SubstitutionService", () => {
  let service: SubstitutionService;

  const mockRepository = {
    createSubstitution: jest.fn(),
    findSubstitutions: jest.fn(),
  };

  const mockNotificationsService = {
    getTokensForUsers: jest.fn().mockResolvedValue([]),
    sendPushNotifications: jest.fn().mockResolvedValue(null),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubstitutionService,
        { provide: SubstitutionRepository, useValue: mockRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SubstitutionService>(SubstitutionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("creates a teacher substitution entry", async () => {
    const dto = {
      leaveApplicationId: "leave-uuid",
      primaryTeacherId: "teacher1-uuid",
      substituteTeacherId: "teacher2-uuid",
      date: "2026-08-05",
      timetablePeriodId: "period-uuid",
    };
    mockRepository.createSubstitution.mockResolvedValue({
      id: "sub-uuid",
      ...dto,
      timetablePeriod: { startTime: "08:00", endTime: "08:45" },
    });

    const result = await service.createSubstitution(dto);
    expect(result.id).toBe("sub-uuid");
  });
});
