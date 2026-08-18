import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowDefinitionRepository } from './repositories/workflow-definition.repository';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;

  const mockRepository = {
    upsert: jest.fn(),
    findByEntityType: jest.fn(),
    findByEntityTypeAndName: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

  describe('createDefinition', () => {
    const dto = {
      entityType: 'purchase-requisition',
      name: 'Procurement Approval',
      stages: ['Pending', 'Approved', 'Rejected'],
      transitions: [
        { from: 'Pending', to: 'Approved' },
        { from: 'Pending', to: 'Rejected' },
      ],
    };

    it('creates a new definition when the entityType/name pair is unused', async () => {
      mockRepository.findByEntityTypeAndName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 'wf-1', ...dto });

      const result = await service.createDefinition(dto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        entityType: dto.entityType,
        name: dto.name,
        stages: dto.stages,
        transitions: dto.transitions,
      });
      expect(result.id).toBe('wf-1');
    });

    it('throws ConflictException when the entityType/name pair already exists', async () => {
      mockRepository.findByEntityTypeAndName.mockResolvedValue({ id: 'wf-1' });

      await expect(service.createDefinition(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateDefinition', () => {
    it('updates stages/transitions for an existing definition', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'wf-1' });
      mockRepository.update.mockResolvedValue({
        id: 'wf-1',
        stages: ['Pending', 'Approved'],
      });

      const result = await service.updateDefinition('wf-1', {
        stages: ['Pending', 'Approved'],
      });

      expect(mockRepository.update).toHaveBeenCalledWith('wf-1', {
        stages: ['Pending', 'Approved'],
        transitions: undefined,
      });
      expect(result.stages).toEqual(['Pending', 'Approved']);
    });

    it('throws NotFoundException when the definition does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateDefinition('missing-id', { stages: ['A'] }),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteDefinition', () => {
    it('deletes an existing definition', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'wf-1' });
      mockRepository.delete.mockResolvedValue({ id: 'wf-1' });

      await service.deleteDefinition('wf-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('wf-1');
    });

    it('throws NotFoundException when the definition does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteDefinition('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateTransition', () => {
    it('reports an unregistered entity type', async () => {
      mockRepository.findByEntityType.mockResolvedValue(null);

      const result = await service.validateTransition('unknown', 'A', 'B');

      expect(result).toEqual({
        valid: false,
        reason:
          'No workflow definition registered for entity type "unknown".',
      });
    });

    it('validates a legal transition', async () => {
      mockRepository.findByEntityType.mockResolvedValue({
        name: 'Discipline Case',
        stages: ['Open', 'Resolved', 'Escalated'],
        transitions: [{ from: 'Open', to: 'Resolved' }],
      });

      const result = await service.validateTransition(
        'discipline-case',
        'Open',
        'Resolved',
      );

      expect(result).toEqual({ valid: true });
    });

    it('rejects an illegal transition with a reason', async () => {
      mockRepository.findByEntityType.mockResolvedValue({
        name: 'Discipline Case',
        stages: ['Open', 'Resolved', 'Escalated'],
        transitions: [{ from: 'Open', to: 'Resolved' }],
      });

      const result = await service.validateTransition(
        'discipline-case',
        'Resolved',
        'Open',
      );

      expect(result).toEqual({
        valid: false,
        reason: '"Resolved" → "Open" is not a legal transition for Discipline Case.',
      });
    });
  });
});
