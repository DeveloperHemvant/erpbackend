import { Test, TestingModule } from '@nestjs/testing';
import { MedicalService } from './medical.service';
import { MedicalRepository } from './repositories/medical.repository';

describe('MedicalService', () => {
  let service: MedicalService;

  const mockRepository = {
    createVisit: jest.fn(),
    findVisits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalService,
        { provide: MedicalRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MedicalService>(MedicalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs a medical visit record', async () => {
    const dto = {
      studentId: 'student-uuid',
      symptoms: 'Fever',
      treatment: 'Paracetamol',
    };
    mockRepository.createVisit.mockResolvedValue({ id: 'visit-uuid', ...dto });

    const result = await service.createVisit('staff-uuid', dto);
    expect(result.symptoms).toBe('Fever');
  });
});
