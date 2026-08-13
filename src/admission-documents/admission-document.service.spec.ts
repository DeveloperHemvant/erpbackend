import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdmissionDocumentService } from './admission-document.service';
import { AdmissionDocumentRepository } from './repositories/admission-document.repository';
import { StorageService } from '../storage/storage.service';

describe('AdmissionDocumentService', () => {
  let service: AdmissionDocumentService;

  const mockRepository = {
    create: jest.fn(),
    findByStudent: jest.fn(),
    findById: jest.fn(),
    updateVerification: jest.fn(),
    delete: jest.fn(),
  };

  const mockStorage = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionDocumentService,
        { provide: AdmissionDocumentRepository, useValue: mockRepository },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<AdmissionDocumentService>(AdmissionDocumentService);
  });

  describe('uploadDocument', () => {
    it('uploads the file bytes through StorageService and persists the returned url', async () => {
      mockStorage.uploadFile.mockResolvedValue({
        url: '/uploads/admission-documents/student-1/x.pdf',
        key: 'admission-documents/student-1/x.pdf',
      });
      mockRepository.create.mockResolvedValue({ id: 'doc-1' });

      const file = { originalname: 'birth-cert.pdf', size: 100, buffer: Buffer.from('x'), mimetype: 'application/pdf' };
      const result = await service.uploadDocument('student-1', 'Birth Certificate', file);

      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
        file.buffer,
        'admission-documents/student-1',
        'birth-cert.pdf',
        'application/pdf',
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        studentId: 'student-1',
        documentType: 'Birth Certificate',
        fileUrl: '/uploads/admission-documents/student-1/x.pdf',
      });
      expect(result).toEqual({ id: 'doc-1' });
    });
  });

  describe('setVerification', () => {
    it('throws NotFoundException for a missing document', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.setVerification('missing', true)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.updateVerification).not.toHaveBeenCalled();
    });

    it('updates verification status for an existing document', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'doc-1' });
      mockRepository.updateVerification.mockResolvedValue({ id: 'doc-1', isVerified: true });

      const result = await service.setVerification('doc-1', true);

      expect(mockRepository.updateVerification).toHaveBeenCalledWith('doc-1', true);
      expect(result.isVerified).toBe(true);
    });
  });

  describe('deleteDocument', () => {
    it('throws NotFoundException for a missing document', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.deleteDocument('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing document', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'doc-1' });
      mockRepository.delete.mockResolvedValue({ id: 'doc-1' });

      await service.deleteDocument('doc-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('doc-1');
    });
  });
});
