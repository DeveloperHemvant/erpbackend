import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from './consent.service';
import { ConsentRepository } from './repositories/consent.repository';
import { AttachmentsService } from '../attachments/attachments.service';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockRepository = {
    findActiveStudentIds: jest.fn(),
    findEnrolledStudentIdsInSection: jest.fn(),
    createRequest: jest.fn(),
    createResponses: jest.fn(),
    findRequests: jest.fn(),
    findRequestById: jest.fn(),
    findResponseById: jest.fn(),
    findChildStudentIds: jest.fn(),
    findResponsesForParent: jest.fn(),
    updateResponse: jest.fn(),
  };

  const mockAttachments = {
    uploadAttachmentPreauthorized: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: ConsentRepository, useValue: mockRepository },
        { provide: AttachmentsService, useValue: mockAttachments },
      ],
    }).compile();
    service = module.get<ConsentService>(ConsentService);
  });

  describe('createConsentRequest', () => {
    it('resolves ALL to every active student and fans out one response each', async () => {
      mockRepository.findActiveStudentIds.mockResolvedValue(['s1', 's2', 's3']);
      mockRepository.createRequest.mockResolvedValue({ id: 'req-1' });

      const result = await service.createConsentRequest(
        { title: 'Photo Policy', description: 'x', targetType: 'ALL' } as any,
        'staff-1',
      );

      expect(mockRepository.createResponses).toHaveBeenCalledWith([
        { consentRequestId: 'req-1', studentId: 's1' },
        { consentRequestId: 'req-1', studentId: 's2' },
        { consentRequestId: 'req-1', studentId: 's3' },
      ]);
      expect(result.recipientCount).toBe(3);
    });

    it('requires targetSectionId for SECTION targeting', async () => {
      await expect(
        service.createConsentRequest(
          { title: 'Trip', description: 'x', targetType: 'SECTION' } as any,
          'staff-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.createRequest).not.toHaveBeenCalled();
    });

    it('resolves SECTION to enrolled students in that section', async () => {
      mockRepository.findEnrolledStudentIdsInSection.mockResolvedValue(['s5']);
      mockRepository.createRequest.mockResolvedValue({ id: 'req-2' });

      await service.createConsentRequest(
        {
          title: 'Trip',
          description: 'x',
          targetType: 'SECTION',
          targetSectionId: 'sec-1',
        } as any,
        'staff-1',
      );

      expect(mockRepository.findEnrolledStudentIdsInSection).toHaveBeenCalledWith('sec-1');
      expect(mockRepository.createResponses).toHaveBeenCalledWith([
        { consentRequestId: 'req-2', studentId: 's5' },
      ]);
    });

    it('requires targetStudentId for STUDENT targeting', async () => {
      await expect(
        service.createConsentRequest(
          { title: 'x', description: 'x', targetType: 'STUDENT' } as any,
          'staff-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the resolved audience is empty', async () => {
      mockRepository.findActiveStudentIds.mockResolvedValue([]);
      await expect(
        service.createConsentRequest(
          { title: 'x', description: 'x', targetType: 'ALL' } as any,
          'staff-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.createRequest).not.toHaveBeenCalled();
    });
  });

  describe('getConsentRequestDetail', () => {
    it('throws NotFound for a missing request', async () => {
      mockRepository.findRequestById.mockResolvedValue(null);
      await expect(service.getConsentRequestDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getResponsesForParent', () => {
    it('returns an empty list without querying responses when the parent has no linked children', async () => {
      mockRepository.findChildStudentIds.mockResolvedValue([]);
      const result = await service.getResponsesForParent('parent-1');
      expect(result).toEqual([]);
      expect(mockRepository.findResponsesForParent).not.toHaveBeenCalled();
    });
  });

  describe('respondToConsent', () => {
    it('throws NotFound for a missing response', async () => {
      mockRepository.findResponseById.mockResolvedValue(null);
      await expect(
        service.respondToConsent('missing', 'Signed', 'parent-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates status without uploading when no signature file is given', async () => {
      mockRepository.findResponseById.mockResolvedValue({ id: 'resp-1' });
      mockRepository.updateResponse.mockResolvedValue({ id: 'resp-1', status: 'Signed' });

      await service.respondToConsent('resp-1', 'Signed', 'parent-1');

      expect(mockAttachments.uploadAttachmentPreauthorized).not.toHaveBeenCalled();
      const call = mockRepository.updateResponse.mock.calls[0][1];
      expect(call.status).toBe('Signed');
      expect(call.respondedById).toBe('parent-1');
      expect(call.signatureAttachmentId).toBeUndefined();
    });

    it('uploads the signature pre-authorized and links its attachment id', async () => {
      mockRepository.findResponseById.mockResolvedValue({ id: 'resp-1' });
      mockAttachments.uploadAttachmentPreauthorized.mockResolvedValue({ id: 'att-9' });
      mockRepository.updateResponse.mockResolvedValue({ id: 'resp-1' });
      const file = { originalname: 'sig.png', size: 5, buffer: Buffer.from('x') };

      await service.respondToConsent('resp-1', 'Declined', 'parent-1', file);

      expect(mockAttachments.uploadAttachmentPreauthorized).toHaveBeenCalledWith(
        'consent-response',
        'resp-1',
        file,
        'parent-1',
      );
      const call = mockRepository.updateResponse.mock.calls[0][1];
      expect(call.signatureAttachmentId).toBe('att-9');
      expect(call.status).toBe('Declined');
    });
  });
});
