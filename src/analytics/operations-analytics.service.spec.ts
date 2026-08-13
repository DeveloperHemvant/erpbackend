import { Test, TestingModule } from '@nestjs/testing';
import { OperationsAnalyticsService } from './operations-analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import type { TenantContext } from '../prisma/tenant-context';

describe('OperationsAnalyticsService', () => {
  let service: OperationsAnalyticsService;

  const unrestrictedTenant: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  const mockRepo = {
    findTripStatusesToday: jest.fn(),
    findVehicleStatuses: jest.fn(),
    countOpenBreakdowns: jest.fn(),
    findApprovedFuelLogs: jest.fn(),
    findOpenDisciplineIncidents: jest.fn(),
    findRecentDisciplineIncidents: jest.fn(),
    findHostelRoomsWithActiveAllocations: jest.fn(),
    findGatePasses: jest.fn(),
    countMedicalVisitsToday: jest.fn(),
    findRecentMedicalVisits: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsAnalyticsService,
        { provide: AnalyticsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OperationsAnalyticsService>(OperationsAnalyticsService);
  });

  describe('getFleetStatus', () => {
    it('groups trips and vehicles by status', async () => {
      mockRepo.findTripStatusesToday.mockResolvedValue([
        { status: 'In Progress' }, { status: 'In Progress' }, { status: 'Completed' },
      ]);
      mockRepo.findVehicleStatuses.mockResolvedValue([
        { status: 'Active' }, { status: 'Active' }, { status: 'Maintenance' },
      ]);
      mockRepo.countOpenBreakdowns.mockResolvedValue(1);

      const result = await service.getFleetStatus(unrestrictedTenant);

      expect(result.tripsToday).toEqual(
        expect.arrayContaining([
          { status: 'In Progress', count: 2 },
          { status: 'Completed', count: 1 },
        ]),
      );
      expect(result.vehiclesByStatus).toEqual(
        expect.arrayContaining([
          { status: 'Active', count: 2 },
          { status: 'Maintenance', count: 1 },
        ]),
      );
      expect(result.openBreakdowns).toBe(1);
    });

    it('returns empty groupings rather than throwing when nothing exists today', async () => {
      mockRepo.findTripStatusesToday.mockResolvedValue([]);
      mockRepo.findVehicleStatuses.mockResolvedValue([]);
      mockRepo.countOpenBreakdowns.mockResolvedValue(0);

      const result = await service.getFleetStatus(unrestrictedTenant);
      expect(result.tripsToday).toEqual([]);
      expect(result.vehiclesByStatus).toEqual([]);
    });
  });

  describe('getFuelUsage', () => {
    it('sums litres/cost and averages only logs with a real mileage value', async () => {
      mockRepo.findApprovedFuelLogs.mockResolvedValue([
        { litres: 40, totalCost: 4000, mileage: 10 },
        { litres: 35, totalCost: 3500, mileage: 8 },
        { litres: 20, totalCost: 2000, mileage: null }, // no mileage computed yet — excluded from avg
      ]);

      const result = await service.getFuelUsage(unrestrictedTenant);

      expect(result.totalLitres).toBe(95);
      expect(result.totalCost).toBe(9500);
      expect(result.avgMileage).toBe(9); // (10+8)/2, not /3
      expect(result.logCount).toBe(3);
    });

    it('reports avgMileage as null rather than NaN when no log has a computed mileage', async () => {
      mockRepo.findApprovedFuelLogs.mockResolvedValue([
        { litres: 40, totalCost: 4000, mileage: null },
      ]);
      const result = await service.getFuelUsage(unrestrictedTenant);
      expect(result.avgMileage).toBeNull();
    });

    it('returns all zeros rather than throwing on an empty window', async () => {
      mockRepo.findApprovedFuelLogs.mockResolvedValue([]);
      const result = await service.getFuelUsage(unrestrictedTenant);
      expect(result).toEqual({ totalLitres: 0, totalCost: 0, avgMileage: null, logCount: 0 });
    });
  });

  describe('getDisciplineBreakdown', () => {
    it('buckets open incidents by severity and category', async () => {
      mockRepo.findOpenDisciplineIncidents.mockResolvedValue([
        { severity: 'Minor', category: 'Disruption' },
        { severity: 'Minor', category: 'Disruption' },
        { severity: 'Major', category: 'Bullying' },
      ]);
      mockRepo.findRecentDisciplineIncidents.mockResolvedValue([]);

      const result = await service.getDisciplineBreakdown(unrestrictedTenant);

      expect(result.openCount).toBe(3);
      expect(result.bySeverity).toEqual(
        expect.arrayContaining([{ label: 'Minor', count: 2 }, { label: 'Major', count: 1 }]),
      );
      expect(result.byCategory).toEqual(
        expect.arrayContaining([{ label: 'Disruption', count: 2 }, { label: 'Bullying', count: 1 }]),
      );
    });

    it('reshapes recent incidents with student names and ISO dates', async () => {
      mockRepo.findOpenDisciplineIncidents.mockResolvedValue([]);
      mockRepo.findRecentDisciplineIncidents.mockResolvedValue([
        {
          id: 'd1',
          category: 'Disruption',
          severity: 'Minor',
          status: 'Open',
          incidentDate: new Date('2026-08-01T00:00:00.000Z'),
          student: { fullName: 'Aarav Sharma' },
        },
      ]);

      const result = await service.getDisciplineBreakdown(unrestrictedTenant);
      expect(result.recent[0]).toEqual({
        id: 'd1',
        studentName: 'Aarav Sharma',
        category: 'Disruption',
        severity: 'Minor',
        status: 'Open',
        incidentDate: '2026-08-01T00:00:00.000Z',
      });
    });
  });

  describe('getHostelOccupancy', () => {
    it('aggregates capacity/occupied per hostel and fleet-wide', async () => {
      mockRepo.findHostelRoomsWithActiveAllocations.mockResolvedValue([
        { id: 'r1', capacity: 4, hostel: { id: 'h1', name: 'Boys A' }, allocations: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'r2', capacity: 4, hostel: { id: 'h1', name: 'Boys A' }, allocations: [{ id: 'a3' }] },
        { id: 'r3', capacity: 6, hostel: { id: 'h2', name: 'Girls A' }, allocations: [] },
      ]);

      const result = await service.getHostelOccupancy(unrestrictedTenant);

      expect(result.totalCapacity).toBe(14);
      expect(result.totalOccupied).toBe(3);
      expect(result.occupancyRate).toBe(21); // round(3/14*100)
      expect(result.byHostel).toEqual(
        expect.arrayContaining([
          { name: 'Boys A', capacity: 8, occupied: 3, occupancyRate: 38 },
          { name: 'Girls A', capacity: 6, occupied: 0, occupancyRate: 0 },
        ]),
      );
    });

    it('returns 0% rather than dividing by zero when there are no rooms', async () => {
      mockRepo.findHostelRoomsWithActiveAllocations.mockResolvedValue([]);
      const result = await service.getHostelOccupancy(unrestrictedTenant);
      expect(result.occupancyRate).toBe(0);
      expect(result.byHostel).toEqual([]);
    });
  });

  describe('getGatePasses', () => {
    it('counts issued-today and currently-out independently', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);

      mockRepo.findGatePasses.mockResolvedValue([
        { status: 'Approved', exitTime: today, returnTime: null }, // issued today AND still out
        { status: 'Approved', exitTime: today, returnTime: today }, // issued today, already back
        { status: 'Approved', exitTime: yesterday, returnTime: null }, // still out from yesterday, not "issued today"
      ]);

      const result = await service.getGatePasses(unrestrictedTenant);

      expect(result.issuedToday).toBe(2);
      expect(result.currentlyOut).toBe(2);
    });

    it('returns zero counts rather than throwing when there are no passes', async () => {
      mockRepo.findGatePasses.mockResolvedValue([]);
      const result = await service.getGatePasses(unrestrictedTenant);
      expect(result).toEqual({ issuedToday: 0, currentlyOut: 0 });
    });
  });

  describe('getMedicalRoom', () => {
    it("reports today's count and reshapes recent visits with student names", async () => {
      mockRepo.countMedicalVisitsToday.mockResolvedValue(3);
      mockRepo.findRecentMedicalVisits.mockResolvedValue([
        {
          id: 'v1',
          reason: 'Headache',
          actionTaken: 'Observed and Released',
          visitDate: new Date('2026-08-07T09:00:00.000Z'),
          student: { fullName: 'Diya Patel' },
        },
      ]);

      const result = await service.getMedicalRoom(unrestrictedTenant);

      expect(result.visitsToday).toBe(3);
      expect(result.recent[0]).toEqual({
        id: 'v1',
        studentName: 'Diya Patel',
        reason: 'Headache',
        actionTaken: 'Observed and Released',
        visitDate: '2026-08-07T09:00:00.000Z',
      });
    });
  });

  describe('Campus Isolation Phase 3 — tenantContext threading', () => {
    const restrictedTenant: TenantContext = {
      userId: 'staff-1',
      role: 'Teacher',
      permissions: ['VIEW_REPORTS'],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    };

    beforeEach(() => {
      mockRepo.findTripStatusesToday.mockResolvedValue([]);
      mockRepo.findVehicleStatuses.mockResolvedValue([]);
      mockRepo.countOpenBreakdowns.mockResolvedValue(0);
      mockRepo.findApprovedFuelLogs.mockResolvedValue([]);
      mockRepo.findOpenDisciplineIncidents.mockResolvedValue([]);
      mockRepo.findRecentDisciplineIncidents.mockResolvedValue([]);
      mockRepo.findHostelRoomsWithActiveAllocations.mockResolvedValue([]);
      mockRepo.findGatePasses.mockResolvedValue([]);
      mockRepo.countMedicalVisitsToday.mockResolvedValue(0);
      mockRepo.findRecentMedicalVisits.mockResolvedValue([]);
    });

    it('getFleetStatus passes tenantContext through to all 3 repo calls', async () => {
      await service.getFleetStatus(restrictedTenant);
      expect(mockRepo.findTripStatusesToday).toHaveBeenCalledWith(
        expect.any(String),
        restrictedTenant,
      );
      expect(mockRepo.findVehicleStatuses).toHaveBeenCalledWith(restrictedTenant);
      expect(mockRepo.countOpenBreakdowns).toHaveBeenCalledWith(restrictedTenant);
    });

    it('getFuelUsage passes tenantContext through to findApprovedFuelLogs', async () => {
      await service.getFuelUsage(restrictedTenant);
      expect(mockRepo.findApprovedFuelLogs).toHaveBeenCalledWith(
        expect.any(String),
        restrictedTenant,
      );
    });

    it('getDisciplineBreakdown passes tenantContext through to both repo calls', async () => {
      await service.getDisciplineBreakdown(restrictedTenant);
      expect(mockRepo.findOpenDisciplineIncidents).toHaveBeenCalledWith(restrictedTenant);
      expect(mockRepo.findRecentDisciplineIncidents).toHaveBeenCalledWith(
        expect.any(Number),
        restrictedTenant,
      );
    });

    it('getHostelOccupancy passes tenantContext through to findHostelRoomsWithActiveAllocations', async () => {
      await service.getHostelOccupancy(restrictedTenant);
      expect(mockRepo.findHostelRoomsWithActiveAllocations).toHaveBeenCalledWith(restrictedTenant);
    });

    it('getGatePasses passes tenantContext through to findGatePasses', async () => {
      await service.getGatePasses(restrictedTenant);
      expect(mockRepo.findGatePasses).toHaveBeenCalledWith(
        expect.any(Object),
        restrictedTenant,
      );
    });

    it('getMedicalRoom passes tenantContext through to both repo calls', async () => {
      await service.getMedicalRoom(restrictedTenant);
      expect(mockRepo.countMedicalVisitsToday).toHaveBeenCalledWith(
        expect.any(Object),
        restrictedTenant,
      );
      expect(mockRepo.findRecentMedicalVisits).toHaveBeenCalledWith(
        expect.any(Number),
        restrictedTenant,
      );
    });
  });
});
