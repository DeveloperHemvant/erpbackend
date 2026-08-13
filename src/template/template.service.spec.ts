import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

describe('TemplateService', () => {
  let service: TemplateService;

  const mockPrismaService = {
    documentTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staff: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    certificate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockRenderer = {
    renderCertificate: jest.fn(),
  };

  const mockStorage = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueCertificate', () => {
    it('rejects when the template is not a CERTIFICATE type', async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue({
        id: 'tmpl-1',
        type: 'ID_CARD',
      });
      await expect(
        service.issueCertificate('tmpl-1', {
          studentId: 'stu-1',
          type: 'MERIT',
          title: 'Merit Award',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('renders and uploads a real PDF, storing the resulting url', async () => {
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue({
        id: 'tmpl-1',
        type: 'CERTIFICATE',
        designJson: {},
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'stu-1',
        fullName: 'Test Student',
        admissionNumber: 'ADM-1',
        photoUrl: null,
      });
      mockRenderer.renderCertificate.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/certificates/tmpl-1/x.pdf' });
      mockPrismaService.certificate.create.mockResolvedValue({ id: 'cert-1' });

      await service.issueCertificate('tmpl-1', {
        studentId: 'stu-1',
        type: 'MERIT',
        title: 'Merit Award',
      });

      expect(mockRenderer.renderCertificate).toHaveBeenCalled();
      expect(mockPrismaService.certificate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileUrl: '/uploads/certificates/tmpl-1/x.pdf',
          status: 'Active',
        }),
      });
    });
  });

  describe('requestCertificate', () => {
    it('creates a Requested-status certificate with no template/fileUrl yet', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({ id: 'stu-1' });
      mockPrismaService.certificate.create.mockResolvedValue({ id: 'cert-1' });

      await service.requestCertificate({
        studentId: 'stu-1',
        type: 'BONAFIDE',
        title: 'Bonafide Certificate',
      });

      expect(mockPrismaService.certificate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'Requested' }),
      });
      expect(mockRenderer.renderCertificate).not.toHaveBeenCalled();
    });
  });

  describe('approveCertificateRequest', () => {
    it('throws NotFound when the certificate does not exist', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);
      await expect(
        service.approveCertificateRequest('missing', 'tmpl-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a certificate that is not in Requested status', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        status: 'Active',
        studentId: 'stu-1',
      });
      await expect(
        service.approveCertificateRequest('cert-1', 'tmpl-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('renders, uploads, and activates a requested certificate', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        status: 'Requested',
        studentId: 'stu-1',
        type: 'BONAFIDE',
        title: 'Bonafide Certificate',
      });
      mockPrismaService.documentTemplate.findUnique.mockResolvedValue({
        id: 'tmpl-1',
        type: 'CERTIFICATE',
        designJson: {},
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'stu-1',
        fullName: 'Test Student',
        admissionNumber: 'ADM-1',
        photoUrl: null,
      });
      mockRenderer.renderCertificate.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/certificates/tmpl-1/x.pdf' });
      mockPrismaService.certificate.update.mockResolvedValue({ id: 'cert-1', status: 'Active' });

      await service.approveCertificateRequest('cert-1', 'tmpl-1');

      expect(mockPrismaService.certificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        data: { templateId: 'tmpl-1', fileUrl: '/uploads/certificates/tmpl-1/x.pdf', status: 'Active' },
      });
    });
  });

  describe('rejectCertificateRequest', () => {
    it('throws NotFound when the certificate does not exist', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);
      await expect(service.rejectCertificateRequest('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('sets status to Rejected', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({ id: 'cert-1' });
      mockPrismaService.certificate.update.mockResolvedValue({ id: 'cert-1', status: 'Rejected' });
      await service.rejectCertificateRequest('cert-1');
      expect(mockPrismaService.certificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        data: { status: 'Rejected' },
      });
    });
  });
});
