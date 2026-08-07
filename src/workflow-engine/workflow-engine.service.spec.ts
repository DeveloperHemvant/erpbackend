import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowDefinitionRepository } from './repositories/workflow-definition.repository';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;

  const mockRepository = {
    findByEntityType: jest.fn(),
    upsert: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        { provide: WorkflowDefinitionRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateTransition', () => {
    it('returns invalid when no definition is registered for the entity type', async () => {
      mockRepository.findByEntityType.mockResolvedValue(null);

      const result = await service.validateTransition(
        'unknown-entity',
        'A',
        'B',
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No workflow definition');
    });

    it('rejects a transition through an unknown stage', async () => {
      mockRepository.findByEntityType.mockResolvedValue({
        name: 'Admissions Pipeline',
        stages: ['New', 'Contacted'],
        transitions: [{ from: 'New', to: 'Contacted' }],
      });

      const result = await service.validateTransition(
        'applicant',
        'New',
        'NotARealStage',
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unknown stage');
    });

    it('accepts a legal transition present in the definition', async () => {
      mockRepository.findByEntityType.mockResolvedValue({
        name: 'Admissions Pipeline',
        stages: ['New', 'Contacted', 'Lost'],
        transitions: [
          { from: 'New', to: 'Contacted' },
          { from: 'New', to: 'Lost' },
        ],
      });

      const result = await service.validateTransition(
        'applicant',
        'New',
        'Lost',
      );

      expect(result).toEqual({ valid: true });
    });

    it('rejects a transition not present in the definition even if both stages are legal', async () => {
      mockRepository.findByEntityType.mockResolvedValue({
        name: 'Discipline Case',
        stages: ['Open', 'Resolved', 'Escalated'],
        transitions: [
          { from: 'Open', to: 'Resolved' },
          { from: 'Open', to: 'Escalated' },
        ],
      });

      const result = await service.validateTransition(
        'discipline-case',
        'Escalated',
        'Open',
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not a legal transition');
    });
  });
});
