import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardsService } from './report-cards.service';
import { ReportCardRepository } from './repositories/report-card.repository';
import { ExamRepository } from '../exams/repositories/exam.repository';
import { CommunicationService } from '../communication/communication.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

describe('ReportCardsService', () => {
  let service: ReportCardsService;

  const mockRepository = {
    findByIdWithContext: jest.fn(),
    findById: jest.fn(),
    updateSignature: jest.fn(),
  };
  const mockRenderer = { renderReportCard: jest.fn() };
  const mockStorage = { uploadFile: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCardsService,
        { provide: ReportCardRepository, useValue: mockRepository },
        { provide: ExamRepository, useValue: {} },
        { provide: CommunicationService, useValue: {} },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();
    service = module.get<ReportCardsService>(ReportCardsService);
  });

  describe('renderReportCardPdf', () => {
    it('throws NotFound for a missing report card', async () => {
      mockRepository.findByIdWithContext.mockResolvedValue(null);
      await expect(service.renderReportCardPdf('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequest when the report card has no student', async () => {
      mockRepository.findByIdWithContext.mockResolvedValue({
        id: 'rc-1',
        enrollment: { student: null, section: null },
      });
      await expect(service.renderReportCardPdf('rc-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('renders and uploads, returning the real url', async () => {
      mockRepository.findByIdWithContext.mockResolvedValue({
        id: 'rc-1',
        enrollmentId: 'enr-1',
        gpa: 'A',
        attendanceRate: '95%',
        remarks: null,
        isApproved: true,
        computedData: { subjects: [] },
        exam: { name: 'Mid-Term' },
        enrollment: {
          student: { fullName: 'Test Student', admissionNumber: 'ADM-1' },
          section: { name: 'B', class: { grade: 'Grade 8' } },
        },
      });
      mockRenderer.renderReportCard.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/report-cards/enr-1/x.pdf' });

      const result = await service.renderReportCardPdf('rc-1');

      expect(mockRenderer.renderReportCard).toHaveBeenCalledWith(
        expect.objectContaining({ gpa: 'A', isApproved: true }),
        expect.objectContaining({
          studentName: 'Test Student',
          admissionNumber: 'ADM-1',
          className: 'Grade 8 - B',
          examName: 'Mid-Term',
        }),
      );
      expect(result).toEqual({ url: '/uploads/report-cards/enr-1/x.pdf' });
    });
  });

  describe('signReportCard', () => {
    it('throws NotFoundException when the report card does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.signReportCard('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.updateSignature).not.toHaveBeenCalled();
    });

    it('marks the report card signed and stores the signature attachment id', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rc-1' });
      mockRepository.updateSignature.mockResolvedValue({
        id: 'rc-1',
        parentSigned: true,
        signatureAttachmentId: 'att-1',
      });

      const result = await service.signReportCard('rc-1', 'att-1');

      expect(mockRepository.updateSignature).toHaveBeenCalledWith('rc-1', 'att-1');
      expect(result.parentSigned).toBe(true);
    });

    it('allows signing without a captured signature image', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'rc-1' });
      mockRepository.updateSignature.mockResolvedValue({ id: 'rc-1', parentSigned: true });

      await service.signReportCard('rc-1');

      expect(mockRepository.updateSignature).toHaveBeenCalledWith('rc-1', undefined);
    });
  });
});
