import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RulesEngineService } from './rules-engine.service';
import { RuleRepository } from './repositories/rule.repository';

describe('RulesEngineService', () => {
  let service: RulesEngineService;

  const mockRepository = {
    findByKey: jest.fn(),
    upsert: jest.fn(),
    findAll: jest.fn(),
  };

  const siblingDiscountRule = {
    key: 'sibling-discount',
    active: true,
    definition: {
      conditions: [
        {
          field: 'isStaffChild',
          op: '==',
          value: true,
          then: {
            discountPercent: 100,
            reason: 'Staff Child Concession (100% Free)',
          },
        },
        {
          field: 'siblingCount',
          op: '>=',
          value: 3,
          then: {
            discountPercent: 100,
            reason: 'Sibling Concession (3+ children: 100% Free)',
          },
        },
        {
          field: 'siblingCount',
          op: '==',
          value: 2,
          then: {
            discountPercent: 20,
            reason: 'Sibling Concession (2 children: 20% Discount)',
          },
        },
      ],
      default: { discountPercent: 0, reason: 'None' },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesEngineService,
        { provide: RuleRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RulesEngineService>(RulesEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    it('throws NotFoundException for an unknown rule key', async () => {
      mockRepository.findByKey.mockResolvedValue(null);

      await expect(service.evaluate('does-not-exist', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for an inactive rule', async () => {
      mockRepository.findByKey.mockResolvedValue({
        ...siblingDiscountRule,
        active: false,
      });

      await expect(service.evaluate('sibling-discount', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('matches the staff-child condition before sibling-count conditions', async () => {
      mockRepository.findByKey.mockResolvedValue(siblingDiscountRule);

      const result = await service.evaluate('sibling-discount', {
        isStaffChild: true,
        siblingCount: 0,
      });

      expect(result.matched).toBe(true);
      expect(result.result).toEqual({
        discountPercent: 100,
        reason: 'Staff Child Concession (100% Free)',
      });
    });

    it('matches the 3+ siblings condition when staff-child is false', async () => {
      mockRepository.findByKey.mockResolvedValue(siblingDiscountRule);

      const result = await service.evaluate('sibling-discount', {
        isStaffChild: false,
        siblingCount: 3,
      });

      expect(result.result).toEqual({
        discountPercent: 100,
        reason: 'Sibling Concession (3+ children: 100% Free)',
      });
    });

    it('matches the exactly-2-siblings condition', async () => {
      mockRepository.findByKey.mockResolvedValue(siblingDiscountRule);

      const result = await service.evaluate('sibling-discount', {
        isStaffChild: false,
        siblingCount: 2,
      });

      expect(result.result).toEqual({
        discountPercent: 20,
        reason: 'Sibling Concession (2 children: 20% Discount)',
      });
    });

    it('falls back to the default when no condition matches', async () => {
      mockRepository.findByKey.mockResolvedValue(siblingDiscountRule);

      const result = await service.evaluate('sibling-discount', {
        isStaffChild: false,
        siblingCount: 1,
      });

      expect(result.matched).toBe(false);
      expect(result.result).toEqual({ discountPercent: 0, reason: 'None' });
    });
  });
});
