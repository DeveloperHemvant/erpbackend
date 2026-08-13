import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HostelService } from './hostel.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';

describe('HostelService', () => {
  let service: HostelService;

  const mockPrisma = {
    hostelOutpass: { findUnique: jest.fn(), update: jest.fn() },
  };

  const mockAttachments = {
    uploadAttachmentPreauthorized: jest.fn(),
    getAttachmentsPreauthorized: jest.fn(),
    deleteAttachmentPreauthorized: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostelService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AttachmentsService, useValue: mockAttachments },
      ],
    }).compile();
    service = module.get<HostelService>(HostelService);
  });

  describe('resolveOutpass', () => {
    it('rejects Approved when parentConsent is false (the hard gate)', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue({
        parentConsent: false,
      });
      await expect(
        service.resolveOutpass('op-1', 'Approved', 'warden-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.hostelOutpass.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when approving an outpass that does not exist', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue(null);
      await expect(
        service.resolveOutpass('op-missing', 'Approved', 'warden-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows Approved once parentConsent is true', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue({
        parentConsent: true,
      });
      mockPrisma.hostelOutpass.update.mockResolvedValue({
        id: 'op-1',
        status: 'Approved',
      });
      await expect(
        service.resolveOutpass('op-1', 'Approved', 'warden-1'),
      ).resolves.toEqual({ id: 'op-1', status: 'Approved' });
      expect(mockPrisma.hostelOutpass.update).toHaveBeenCalledWith({
        where: { id: 'op-1' },
        data: { status: 'Approved', approvedById: 'warden-1' },
      });
    });

    it('allows Rejected without checking parentConsent at all', async () => {
      mockPrisma.hostelOutpass.update.mockResolvedValue({
        id: 'op-1',
        status: 'Rejected',
      });
      await service.resolveOutpass('op-1', 'Rejected', 'warden-1');
      expect(mockPrisma.hostelOutpass.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.hostelOutpass.update).toHaveBeenCalled();
    });
  });

  describe('giveOutpassConsent', () => {
    it('marks consent given with no attachment when no signature file is provided', async () => {
      mockPrisma.hostelOutpass.update.mockResolvedValue({
        id: 'op-1',
        parentConsent: true,
      });
      await service.giveOutpassConsent('op-1', 'parent-1');
      expect(mockAttachments.uploadAttachmentPreauthorized).not.toHaveBeenCalled();
      const call = mockPrisma.hostelOutpass.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'op-1' });
      expect(call.data.parentConsent).toBe(true);
      expect(call.data.parentConsentAt).toBeInstanceOf(Date);
      expect(call.data.parentConsentAttachmentId).toBeUndefined();
    });

    it('uploads the signature pre-authorized and links its attachment id', async () => {
      mockAttachments.uploadAttachmentPreauthorized.mockResolvedValue({
        id: 'att-1',
      });
      mockPrisma.hostelOutpass.update.mockResolvedValue({ id: 'op-1' });
      const file = { originalname: 'sig.png', size: 10, buffer: Buffer.from('x') };

      await service.giveOutpassConsent('op-1', 'parent-1', file);

      expect(mockAttachments.uploadAttachmentPreauthorized).toHaveBeenCalledWith(
        'hostel-outpass-consent',
        'op-1',
        file,
        'parent-1',
      );
      const call = mockPrisma.hostelOutpass.update.mock.calls[0][0];
      expect(call.data.parentConsentAttachmentId).toBe('att-1');
    });
  });
});
