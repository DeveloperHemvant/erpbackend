import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { OwnershipService } from '../auth/ownership.service';

describe('TemplateController', () => {
  let controller: TemplateController;

  const mockTemplateService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    render: jest.fn(),
    requestCertificate: jest.fn(),
    getCertificates: jest.fn(),
  };

  const mockOwnershipService = {
    assertOwnsStudent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: OwnershipService, useValue: mockOwnershipService },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestCertificate', () => {
    it('rejects a caller who is neither student nor parent', async () => {
      await expect(
        controller.requestCertificate(
          { studentId: 'stu-1', type: 'BONAFIDE', title: 'x' },
          { userId: 'staff-1', role: 'Teacher' } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockOwnershipService.assertOwnsStudent).not.toHaveBeenCalled();
    });

    it('checks ownership before delegating to the service for a parent caller', async () => {
      mockOwnershipService.assertOwnsStudent.mockResolvedValue(undefined);
      mockTemplateService.requestCertificate.mockResolvedValue({ id: 'cert-1' });

      await controller.requestCertificate(
        { studentId: 'stu-1', type: 'BONAFIDE', title: 'x' },
        { userId: 'parent-1', role: 'Parent' } as any,
      );

      expect(mockOwnershipService.assertOwnsStudent).toHaveBeenCalledWith(
        { userId: 'parent-1', role: 'Parent' },
        'stu-1',
      );
      expect(mockTemplateService.requestCertificate).toHaveBeenCalled();
    });
  });

  describe('getMyCertificates', () => {
    it('rejects a caller who is neither student nor parent', async () => {
      await expect(
        controller.getMyCertificates('stu-1', { userId: 'staff-1', role: 'Teacher' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
