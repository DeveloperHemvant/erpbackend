import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { FeeRepository } from './fee.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';

describe('FeeRepository — Campus Isolation Phase 3, Milestone 6', () => {
  let repo: FeeRepository;

  const mockPrisma = {
    feeStructure: { findMany: jest.fn() },
    studentEnrollment: { findMany: jest.fn() },
    feeInvoice: { findMany: jest.fn() },
    feePayment: { findMany: jest.fn() },
    feeRefund: { findMany: jest.fn() },
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Fee Manager',
    permissions: ['MANAGE_FEES'],
    campusId: 'campus-a',
    canAccessAllCampuses: false,
    academicSessionId: 'session-1',
  };
  const unrestricted: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.feeStructure.findMany.mockResolvedValue([]);
    mockPrisma.studentEnrollment.findMany.mockResolvedValue([]);
    mockPrisma.feeInvoice.findMany.mockResolvedValue([]);
    mockPrisma.feePayment.findMany.mockResolvedValue([]);
    mockPrisma.feeRefund.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<FeeRepository>(FeeRepository);
  });

  describe('findAllStructures — the 3-way OR visibility rule', () => {
    it('applies the 3-way OR when restricted', async () => {
      await repo.findAllStructures(restricted);
      expect(mockPrisma.feeStructure.findMany.mock.calls[0][0].where).toEqual({
        OR: [
          { campusId: 'campus-a' },
          { campusId: null, class: { campusId: 'campus-a' } },
          { campusId: null, classId: null },
        ],
      });
    });

    it('applies no filter for canAccessAllCampuses', async () => {
      await repo.findAllStructures(unrestricted);
      expect(mockPrisma.feeStructure.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('throws instead of silently unfiltering if campusId is null while restricted', () => {
      const broken: TenantContext = { ...restricted, campusId: null };
      expect(() => repo.findAllStructures(broken)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findStructuresBySession', () => {
    it('combines sessionId with the 3-way OR when restricted', async () => {
      await repo.findStructuresBySession('sess-1', restricted);
      expect(mockPrisma.feeStructure.findMany.mock.calls[0][0].where).toEqual({
        sessionId: 'sess-1',
        OR: [
          { campusId: 'campus-a' },
          { campusId: null, class: { campusId: 'campus-a' } },
          { campusId: null, classId: null },
        ],
      });
    });

    it('applies only sessionId for canAccessAllCampuses', async () => {
      await repo.findStructuresBySession('sess-1', unrestricted);
      expect(mockPrisma.feeStructure.findMany.mock.calls[0][0].where).toEqual({
        sessionId: 'sess-1',
      });
    });
  });

  describe('findEnrollmentsBySessionEnrolled', () => {
    it('filters by campusId when restricted', async () => {
      await repo.findEnrollmentsBySessionEnrolled('sess-1', restricted);
      expect(
        mockPrisma.studentEnrollment.findMany.mock.calls[0][0].where,
      ).toEqual({ sessionId: 'sess-1', status: 'Enrolled', campusId: 'campus-a' });
    });

    it('applies no campus filter for canAccessAllCampuses', async () => {
      await repo.findEnrollmentsBySessionEnrolled('sess-1', unrestricted);
      expect(
        mockPrisma.studentEnrollment.findMany.mock.calls[0][0].where,
      ).toEqual({ sessionId: 'sess-1', status: 'Enrolled' });
    });
  });

  describe('findAllInvoices / findOverdueInvoices / findInvoicesBySession — own column', () => {
    it('findAllInvoices filters by campusId when restricted', async () => {
      await repo.findAllInvoices(restricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
      });
    });

    it('findOverdueInvoices filters by campusId when restricted', async () => {
      await repo.findOverdueInvoices('2026-08-13', restricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        status: { in: ['Unpaid', 'Overdue'] },
        dueDate: { lt: '2026-08-13' },
        campusId: 'campus-a',
      });
    });

    it('findInvoicesBySession filters by campusId when restricted', async () => {
      await repo.findInvoicesBySession('sess-1', restricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        enrollment: { sessionId: 'sess-1' },
        campusId: 'campus-a',
      });
    });

    it('findInvoicesBySession applies no campus filter for canAccessAllCampuses', async () => {
      await repo.findInvoicesBySession('sess-1', unrestricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        enrollment: { sessionId: 'sess-1' },
      });
    });
  });

  describe('findAllPayments — 1-hop via invoice.campusId', () => {
    it('filters via invoice.campusId when restricted', async () => {
      await repo.findAllPayments(restricted);
      expect(mockPrisma.feePayment.findMany.mock.calls[0][0].where).toEqual({
        invoice: { campusId: 'campus-a' },
      });
    });

    it('applies no filter for canAccessAllCampuses', async () => {
      await repo.findAllPayments(unrestricted);
      expect(mockPrisma.feePayment.findMany.mock.calls[0][0].where).toEqual({});
    });
  });

  describe('findAllRefunds — 2-hop via payment.invoice.campusId', () => {
    it('filters via payment.invoice.campusId when restricted', async () => {
      await repo.findAllRefunds(restricted);
      expect(mockPrisma.feeRefund.findMany.mock.calls[0][0].where).toEqual({
        payment: { invoice: { campusId: 'campus-a' } },
      });
    });

    it('applies no filter for canAccessAllCampuses', async () => {
      await repo.findAllRefunds(unrestricted);
      expect(mockPrisma.feeRefund.findMany.mock.calls[0][0].where).toEqual({});
    });
  });
});
