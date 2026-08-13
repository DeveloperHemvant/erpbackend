import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

describe('HrService', () => {
  let service: HrService;

  const mockPrisma = {
    payslip: { findUnique: jest.fn() },
  };
  const mockRenderer = { renderPayslip: jest.fn() };
  const mockStorage = { uploadFile: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();
    service = module.get<HrService>(HrService);
  });

  describe('renderPayslipPdf', () => {
    it('throws NotFound for a missing payslip', async () => {
      mockPrisma.payslip.findUnique.mockResolvedValue(null);
      await expect(service.renderPayslipPdf('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('renders and uploads, converting Decimal-ish fields to numbers', async () => {
      mockPrisma.payslip.findUnique.mockResolvedValue({
        id: 'ps-1',
        staffId: 'staff-1',
        month: 8,
        year: 2026,
        basicSalary: 45000,
        allowances: 8000,
        fixedDeductions: 3200,
        lopDeductions: 0,
        netSalary: 49800,
        staff: { fullName: 'Test Staff', role: { name: 'Teacher' } },
      });
      mockRenderer.renderPayslip.mockResolvedValue(Buffer.from('%PDF'));
      mockStorage.uploadFile.mockResolvedValue({ url: '/uploads/payslips/staff-1/x.pdf' });

      const result = await service.renderPayslipPdf('ps-1');

      expect(mockRenderer.renderPayslip).toHaveBeenCalledWith(
        expect.objectContaining({ month: 8, year: 2026, netSalary: 49800 }),
        { staffName: 'Test Staff', role: 'Teacher' },
      );
      expect(result).toEqual({ url: '/uploads/payslips/staff-1/x.pdf' });
    });
  });
});
