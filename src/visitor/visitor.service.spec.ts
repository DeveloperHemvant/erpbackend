import { Test, TestingModule } from "@nestjs/testing";
import { VisitorService } from "./visitor.service";
import { VisitorRepository } from "./repositories/visitor.repository";

describe("VisitorService", () => {
  let service: VisitorService;

  const mockRepository = {
    createVisitor: jest.fn(),
    findVisitorById: jest.fn(),
    findVisitors: jest.fn(),
    updateVisitor: jest.fn(),
    createGatePass: jest.fn(),
    findGatePassById: jest.fn(),
    findGatePasses: jest.fn(),
    updateGatePass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorService,
        { provide: VisitorRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<VisitorService>(VisitorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("creates a visitor record with status CheckedIn", async () => {
    const dto = {
      fullName: "Alice Smith",
      phone: "1234567890",
      purpose: "Meeting",
      hostId: "staff-uuid",
    };
    mockRepository.createVisitor.mockResolvedValue({ id: "visitor-uuid", ...dto, status: "CheckedIn" });

    const result = await service.createVisitor(dto);
    expect(result.status).toBe("CheckedIn");
    expect(mockRepository.createVisitor).toHaveBeenCalled();
  });

  it("checks out a visitor record", async () => {
    mockRepository.findVisitorById.mockResolvedValue({ id: "visitor-uuid", status: "CheckedIn" });
    mockRepository.updateVisitor.mockResolvedValue({ id: "visitor-uuid", status: "CheckedOut" });

    const result = await service.checkOutVisitor("visitor-uuid");
    expect(result.status).toBe("CheckedOut");
  });
});
