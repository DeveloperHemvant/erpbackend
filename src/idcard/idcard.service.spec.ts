import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IdCardService } from './idcard.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

describe('IdCardService', () => {
  let service: IdCardService;

  const mockPrisma = {
    idCard: { findFirst: jest.fn() },
  };
  const mockRenderer = { renderIdCard: jest.fn() };
  const mockStorage = { uploadFile: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdCardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();
    service = module.get<IdCardService>(IdCardService);
  });

  describe('renderStudentIdCardPdf', () => {
    it('throws NotFound when the student has no card issued', async () => {
      mockPrisma.idCard.findFirst.mockResolvedValue(null);
      await expect(service.renderStudentIdCardPdf('stu-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('renders using the enrollment section/class as the role label', async () => {
      mockPrisma.idCard.findFirst.mockResolvedValue({
        idNumber: 'STU-001',
        expiryDate: null,
        template: { schoolName: 'Aetheria Academy' },
        student: {
          fullName: 'Test Student',
          photoUrl: null,
          enrollments: [{ section: { name: 'B', class: { grade: 'Grade 8' } } }],
        },
      });
      mockRenderer.renderIdCard.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/id-cards/student/stu-1/x.pdf' });

      const result = await service.renderStudentIdCardPdf('stu-1');

      expect(mockRenderer.renderIdCard).toHaveBeenCalledWith(
        { schoolName: 'Aetheria Academy' },
        expect.objectContaining({ fullName: 'Test Student', role: 'Grade 8 - B', idNumber: 'STU-001' }),
      );
      expect(result).toEqual({ url: '/uploads/id-cards/student/stu-1/x.pdf' });
    });
  });

  describe('renderStaffIdCardPdf', () => {
    it('throws NotFound when the staff member has no card issued', async () => {
      mockPrisma.idCard.findFirst.mockResolvedValue(null);
      await expect(service.renderStaffIdCardPdf('staff-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('renders using the role name', async () => {
      mockPrisma.idCard.findFirst.mockResolvedValue({
        idNumber: 'STF-001',
        expiryDate: null,
        template: { schoolName: 'Aetheria Academy' },
        staff: { fullName: 'Test Teacher', photoUrl: null, role: { name: 'Teacher' } },
      });
      mockRenderer.renderIdCard.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/id-cards/staff/staff-1/x.pdf' });

      const result = await service.renderStaffIdCardPdf('staff-1');

      expect(mockRenderer.renderIdCard).toHaveBeenCalledWith(
        { schoolName: 'Aetheria Academy' },
        expect.objectContaining({ fullName: 'Test Teacher', role: 'Teacher', idNumber: 'STF-001' }),
      );
      expect(result).toEqual({ url: '/uploads/id-cards/staff/staff-1/x.pdf' });
    });
  });
});
