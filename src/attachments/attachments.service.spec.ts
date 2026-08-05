import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsService } from './attachments.service';
import { AttachmentRepository } from './repositories/attachment.repository';

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  const mockRepository = {
    findByEntity: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const staffUser = { userId: 'staff-1', identifier: 's', role: 'HR', permissions: ['MANAGE_USERS'] };
  const unprivilegedUser = { userId: 'staff-2', identifier: 'u', role: 'Driver', permissions: [] };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttachmentsService, { provide: AttachmentRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAttachment', () => {
    it('stores a mock URL built from entityType/entityId/filename when permitted', async () => {
      mockRepository.create.mockResolvedValue({ id: 'a1' });

      await service.uploadAttachment(
        { entityType: 'staff', entityId: 'entity-1' },
        { originalname: 'resume.pdf', size: 1024 },
        staffUser as any,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        entityType: 'staff',
        entityId: 'entity-1',
        fileName: 'resume.pdf',
        sizeBytes: 1024,
        url: '/uploads/staff/entity-1/resume.pdf',
        uploadedById: 'staff-1',
      });
    });

    it('throws Forbidden when the caller lacks permission for this entity type', async () => {
      await expect(
        service.uploadAttachment({ entityType: 'staff', entityId: 'entity-1' }, { originalname: 'x.pdf', size: 1 }, unprivilegedUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAttachment', () => {
    it('throws NotFound when the attachment does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteAttachment('missing-id', staffUser as any)).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when the caller lacks permission for the attachment entity type', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'a1', entityType: 'staff' });

      await expect(service.deleteAttachment('a1', unprivilegedUser as any)).rejects.toThrow(ForbiddenException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes when permitted', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'a1', entityType: 'staff' });
      mockRepository.delete.mockResolvedValue({ id: 'a1' });

      await service.deleteAttachment('a1', staffUser as any);

      expect(mockRepository.delete).toHaveBeenCalledWith('a1');
    });
  });
});
