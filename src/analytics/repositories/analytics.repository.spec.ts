import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../prisma/tenant-context';

describe('AnalyticsRepository — Campus Isolation Phase 3 (Milestones 2 & 3)', () => {
  let repo: AnalyticsRepository;

  const mockPrisma = {
    feeInvoice: { findMany: jest.fn() },
    feePayment: { findMany: jest.fn(), aggregate: jest.fn() },
    feeRefund: { findMany: jest.fn() },
    class: { findMany: jest.fn() },
    eMSGradebook: { count: jest.fn() },
    teacherAssignment: { findMany: jest.fn() },
    transportTrip: { findMany: jest.fn() },
    transportVehicle: { findMany: jest.fn() },
    transportBreakdown: { count: jest.fn() },
    transportFuelLog: { findMany: jest.fn() },
    disciplineIncident: { findMany: jest.fn() },
    hostelRoom: { findMany: jest.fn() },
    studentGatePass: { findMany: jest.fn() },
    healthVisit: { findMany: jest.fn(), count: jest.fn() },
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Teacher',
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
    mockPrisma.feeInvoice.findMany.mockResolvedValue([]);
    mockPrisma.feePayment.findMany.mockResolvedValue([]);
    mockPrisma.feePayment.aggregate.mockResolvedValue({ _sum: { amountPaid: null } });
    mockPrisma.feeRefund.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.eMSGradebook.count.mockResolvedValue(0);
    mockPrisma.teacherAssignment.findMany.mockResolvedValue([]);
    mockPrisma.transportTrip.findMany.mockResolvedValue([]);
    mockPrisma.transportVehicle.findMany.mockResolvedValue([]);
    mockPrisma.transportBreakdown.count.mockResolvedValue(0);
    mockPrisma.transportFuelLog.findMany.mockResolvedValue([]);
    mockPrisma.disciplineIncident.findMany.mockResolvedValue([]);
    mockPrisma.hostelRoom.findMany.mockResolvedValue([]);
    mockPrisma.studentGatePass.findMany.mockResolvedValue([]);
    mockPrisma.healthVisit.findMany.mockResolvedValue([]);
    mockPrisma.healthVisit.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<AnalyticsRepository>(AnalyticsRepository);
  });

  describe('own-column models (FeeInvoice, Class)', () => {
    it('findInvoiceFinancials filters by campusId when restricted', async () => {
      await repo.findInvoiceFinancials(restricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
      });
    });

    it('findInvoiceFinancials applies no filter for canAccessAllCampuses', async () => {
      await repo.findInvoiceFinancials(unrestricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('findRecentInvoices filters by campusId when restricted', async () => {
      await repo.findRecentInvoices(5, restricted);
      expect(mockPrisma.feeInvoice.findMany.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
      });
    });

    it('findClassRevenueBreakdown filters by campusId (required column, requireCampusId) and the active session when restricted', async () => {
      await repo.findClassRevenueBreakdown(restricted);
      expect(mockPrisma.class.findMany.mock.calls[0][0].where).toEqual({
        campusId: 'campus-a',
        session: { isActive: true },
      });
    });

    it('findClassRevenueBreakdown throws instead of silently unfiltering if campusId is null while restricted', () => {
      // requireCampusId() throws synchronously while the where-clause
      // argument is being built, before findMany() is ever called — this
      // is a sync throw, not a rejected Promise, so it needs the
      // function-wrapper form of toThrow(), not .rejects.
      const brokenInvariant: TenantContext = { ...restricted, campusId: null };
      expect(() => repo.findClassRevenueBreakdown(brokenInvariant)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('1-hop relation models (FeePayment via invoice.campusId)', () => {
    it('findPaymentFinancials filters via invoice.campusId when restricted', async () => {
      await repo.findPaymentFinancials(restricted);
      expect(mockPrisma.feePayment.findMany.mock.calls[0][0].where).toEqual({
        invoice: { campusId: 'campus-a' },
      });
    });

    it('findPaymentFinancials applies no filter for canAccessAllCampuses', async () => {
      await repo.findPaymentFinancials(unrestricted);
      expect(mockPrisma.feePayment.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('findRecentPayments filters via invoice.campusId when restricted', async () => {
      await repo.findRecentPayments(5, restricted);
      expect(mockPrisma.feePayment.findMany.mock.calls[0][0].where).toEqual({
        invoice: { campusId: 'campus-a' },
      });
    });

    it('sumFeePaymentsForDate filters via invoice.campusId inside aggregate() when restricted', async () => {
      await repo.sumFeePaymentsForDate('2026-08-13', restricted);
      const args = mockPrisma.feePayment.aggregate.mock.calls[0][0];
      expect(args.where).toEqual({
        paymentDate: '2026-08-13',
        invoice: { campusId: 'campus-a' },
      });
    });

    it('sumFeePaymentsForDate applies no campus filter for canAccessAllCampuses', async () => {
      await repo.sumFeePaymentsForDate('2026-08-13', unrestricted);
      const args = mockPrisma.feePayment.aggregate.mock.calls[0][0];
      expect(args.where).toEqual({ paymentDate: '2026-08-13' });
    });
  });

  describe('2-hop relation models (FeeRefund via payment.invoice.campusId)', () => {
    it('findRefundFinancials filters via payment.invoice.campusId when restricted', async () => {
      await repo.findRefundFinancials(restricted);
      expect(mockPrisma.feeRefund.findMany.mock.calls[0][0].where).toEqual({
        payment: { invoice: { campusId: 'campus-a' } },
      });
    });

    it('findRefundFinancials applies no filter for canAccessAllCampuses', async () => {
      await repo.findRefundFinancials(unrestricted);
      expect(mockPrisma.feeRefund.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('findRecentRefunds filters via payment.invoice.campusId when restricted', async () => {
      await repo.findRecentRefunds(5, restricted);
      expect(mockPrisma.feeRefund.findMany.mock.calls[0][0].where).toEqual({
        payment: { invoice: { campusId: 'campus-a' } },
      });
    });
  });

  describe('Milestone 3 — academic methods (relation-derived, 1-hop)', () => {
    it('countGradebooks filters via class.campusId when restricted', async () => {
      await repo.countGradebooks(true, undefined, restricted);
      expect(mockPrisma.eMSGradebook.count.mock.calls[0][0].where).toEqual({
        session: { isActive: true },
        class: { campusId: 'campus-a' },
      });
    });

    it('countGradebooks applies no campus filter for canAccessAllCampuses', async () => {
      await repo.countGradebooks(true, true, unrestricted);
      expect(mockPrisma.eMSGradebook.count.mock.calls[0][0].where).toEqual({
        session: { isActive: true },
        isPublished: true,
      });
    });

    it('countGradebooks throws instead of silently unfiltering if campusId is null while restricted', () => {
      const brokenInvariant: TenantContext = { ...restricted, campusId: null };
      expect(() =>
        repo.countGradebooks(true, undefined, brokenInvariant),
      ).toThrow(InternalServerErrorException);
    });

    it('findActiveTeacherAssignments filters via staff.campusId when restricted', async () => {
      await repo.findActiveTeacherAssignments('sess-1', restricted);
      expect(mockPrisma.teacherAssignment.findMany.mock.calls[0][0].where).toEqual({
        sessionId: 'sess-1',
        status: 'Active',
        staff: { campusId: 'campus-a' },
      });
    });

    it('findActiveTeacherAssignments applies no campus filter for canAccessAllCampuses', async () => {
      await repo.findActiveTeacherAssignments('sess-1', unrestricted);
      expect(mockPrisma.teacherAssignment.findMany.mock.calls[0][0].where).toEqual({
        sessionId: 'sess-1',
        status: 'Active',
      });
    });
  });

  describe('Milestone 4 — Operations methods, hide-when-restricted (no reliable campus path)', () => {
    it('findTripStatusesToday returns [] without querying when restricted', async () => {
      const result = await repo.findTripStatusesToday('2026-08-13', restricted);
      expect(result).toEqual([]);
      expect(mockPrisma.transportTrip.findMany).not.toHaveBeenCalled();
    });

    it('findTripStatusesToday queries normally for canAccessAllCampuses', async () => {
      await repo.findTripStatusesToday('2026-08-13', unrestricted);
      expect(mockPrisma.transportTrip.findMany.mock.calls[0][0].where).toEqual({
        date: '2026-08-13',
      });
    });

    it('findVehicleStatuses returns [] without querying when restricted', async () => {
      const result = await repo.findVehicleStatuses(restricted);
      expect(result).toEqual([]);
      expect(mockPrisma.transportVehicle.findMany).not.toHaveBeenCalled();
    });

    it('findVehicleStatuses queries normally for canAccessAllCampuses', async () => {
      await repo.findVehicleStatuses(unrestricted);
      expect(mockPrisma.transportVehicle.findMany).toHaveBeenCalledWith({
        select: { status: true },
      });
    });

    it('countOpenBreakdowns returns 0 without querying when restricted', async () => {
      const result = await repo.countOpenBreakdowns(restricted);
      expect(result).toBe(0);
      expect(mockPrisma.transportBreakdown.count).not.toHaveBeenCalled();
    });

    it('countOpenBreakdowns queries normally for canAccessAllCampuses', async () => {
      await repo.countOpenBreakdowns(unrestricted);
      expect(mockPrisma.transportBreakdown.count).toHaveBeenCalledWith({
        where: { status: { in: ['Reported', 'Acknowledged', 'Under Repair'] } },
      });
    });

    it('findApprovedFuelLogs returns [] without querying when restricted', async () => {
      const result = await repo.findApprovedFuelLogs('2026-07-14', restricted);
      expect(result).toEqual([]);
      expect(mockPrisma.transportFuelLog.findMany).not.toHaveBeenCalled();
    });

    it('findApprovedFuelLogs queries normally for canAccessAllCampuses', async () => {
      await repo.findApprovedFuelLogs('2026-07-14', unrestricted);
      expect(mockPrisma.transportFuelLog.findMany.mock.calls[0][0].where).toEqual({
        status: 'Approved',
        date: { gte: '2026-07-14' },
      });
    });

    it('findHostelRoomsWithActiveAllocations returns [] without querying when restricted', async () => {
      const result = await repo.findHostelRoomsWithActiveAllocations(restricted);
      expect(result).toEqual([]);
      expect(mockPrisma.hostelRoom.findMany).not.toHaveBeenCalled();
    });

    it('findHostelRoomsWithActiveAllocations queries normally for canAccessAllCampuses', async () => {
      await repo.findHostelRoomsWithActiveAllocations(unrestricted);
      expect(mockPrisma.hostelRoom.findMany).toHaveBeenCalled();
    });
  });

  describe('Milestone 4 — Operations methods, student-side filtered (competing-path entities)', () => {
    it('findOpenDisciplineIncidents filters via student.enrollments.campusId when restricted', async () => {
      await repo.findOpenDisciplineIncidents(restricted);
      expect(mockPrisma.disciplineIncident.findMany.mock.calls[0][0].where).toEqual({
        status: 'Open',
        student: { enrollments: { some: { campusId: 'campus-a' } } },
      });
    });

    it('findOpenDisciplineIncidents applies no filter for canAccessAllCampuses', async () => {
      await repo.findOpenDisciplineIncidents(unrestricted);
      expect(mockPrisma.disciplineIncident.findMany.mock.calls[0][0].where).toEqual({
        status: 'Open',
      });
    });

    it('findRecentDisciplineIncidents filters via student.enrollments.campusId when restricted', async () => {
      await repo.findRecentDisciplineIncidents(5, restricted);
      expect(mockPrisma.disciplineIncident.findMany.mock.calls[0][0].where).toEqual({
        student: { enrollments: { some: { campusId: 'campus-a' } } },
      });
    });

    it('findGatePasses filters via student.enrollments.campusId when restricted', async () => {
      const range = { gte: new Date('2026-08-13T00:00:00.000Z'), lt: new Date('2026-08-13T23:59:59.999Z') };
      await repo.findGatePasses(range, restricted);
      expect(mockPrisma.studentGatePass.findMany.mock.calls[0][0].where).toEqual({
        OR: [
          { exitTime: { gte: range.gte, lt: range.lt } },
          { status: 'Approved', returnTime: null },
        ],
        student: { enrollments: { some: { campusId: 'campus-a' } } },
      });
    });

    it('findGatePasses applies no student filter for canAccessAllCampuses', async () => {
      const range = { gte: new Date('2026-08-13T00:00:00.000Z'), lt: new Date('2026-08-13T23:59:59.999Z') };
      await repo.findGatePasses(range, unrestricted);
      expect(mockPrisma.studentGatePass.findMany.mock.calls[0][0].where).toEqual({
        OR: [
          { exitTime: { gte: range.gte, lt: range.lt } },
          { status: 'Approved', returnTime: null },
        ],
      });
    });

    it('countMedicalVisitsToday filters via student.enrollments.campusId when restricted', async () => {
      const range = { gte: new Date('2026-08-13T00:00:00.000Z'), lt: new Date('2026-08-13T23:59:59.999Z') };
      await repo.countMedicalVisitsToday(range, restricted);
      expect(mockPrisma.healthVisit.count.mock.calls[0][0].where).toEqual({
        visitDate: { gte: range.gte, lt: range.lt },
        student: { enrollments: { some: { campusId: 'campus-a' } } },
      });
    });

    it('findRecentMedicalVisits filters via student.enrollments.campusId when restricted', async () => {
      await repo.findRecentMedicalVisits(5, restricted);
      expect(mockPrisma.healthVisit.findMany.mock.calls[0][0].where).toEqual({
        student: { enrollments: { some: { campusId: 'campus-a' } } },
      });
    });

    it('findRecentMedicalVisits applies no filter for canAccessAllCampuses', async () => {
      await repo.findRecentMedicalVisits(5, unrestricted);
      expect(mockPrisma.healthVisit.findMany.mock.calls[0][0].where).toEqual({});
    });
  });
});
