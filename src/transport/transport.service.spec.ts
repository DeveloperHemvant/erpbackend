import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransportRepository } from './repositories/transport.repository';
import { TransportOwnershipService } from './transport-ownership.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('TransportService', () => {
  let service: TransportService;

  const mockPrismaService = {
    transportTrip: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transportFuelLog: { create: jest.fn() },
    transportBreakdown: { create: jest.fn() },
    transportAccident: { create: jest.fn() },
    transportExpense: { create: jest.fn() },
    transportRoute: { create: jest.fn() },
    transportRouteStop: { create: jest.fn() },
    transportStudentAssignment: { create: jest.fn(), updateMany: jest.fn() },
  };
  const mockNotificationsService = {};
  const mockTransportRepository = {
    createOdometerLog: jest.fn(),
    findOdometerLogById: jest.fn(),
    closeOdometerLog: jest.fn(),
    createDailyCheck: jest.fn(),
    findFuelLogById: jest.fn(),
    resolveFuelLog: jest.fn(),
    findExpenseById: jest.fn(),
    resolveExpense: jest.fn(),
    findBreakdownById: jest.fn(),
    acknowledgeBreakdown: jest.fn(),
    findAccidentById: jest.fn(),
    acknowledgeAccident: jest.fn(),
    findStopById: jest.fn(),
    findActiveTransportAssignmentForStudent: jest.fn(),
  };
  const mockTransportOwnership = {
    assertVehicleAccess: jest.fn(),
    assertRouteAccess: jest.fn(),
    assertStopAccess: jest.fn(),
  };
  const mockRenderer = {
    renderBusPass: jest.fn(),
  };
  const mockStorage = {
    uploadFile: jest.fn(),
  };

  const driver: AuthenticatedUser = {
    userId: 'driver-1',
    identifier: 'driver@school.test',
    role: 'Driver',
    permissions: ['MANAGE_TRANSPORT'],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };
  const fleetManager: AuthenticatedUser = {
    userId: 'mgr-1',
    identifier: 'mgr@school.test',
    role: 'Transport Manager',
    permissions: ['MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET'],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: TransportRepository, useValue: mockTransportRepository },
        {
          provide: TransportOwnershipService,
          useValue: mockTransportOwnership,
        },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
  });

  describe('resolveFuelLog', () => {
    it('throws NotFoundException when the fuel log does not exist', async () => {
      mockTransportRepository.findFuelLogById.mockResolvedValue(null);

      await expect(
        service.resolveFuelLog(
          'missing',
          { status: 'Approved' },
          fleetManager.userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the log is not Pending', async () => {
      mockTransportRepository.findFuelLogById.mockResolvedValue({
        id: 'f1',
        status: 'Approved',
      });

      await expect(
        service.resolveFuelLog(
          'f1',
          { status: 'Rejected' },
          fleetManager.userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('approves a pending fuel log', async () => {
      mockTransportRepository.findFuelLogById.mockResolvedValue({
        id: 'f1',
        status: 'Pending',
      });
      mockTransportRepository.resolveFuelLog.mockResolvedValue({
        id: 'f1',
        status: 'Approved',
      });

      await service.resolveFuelLog(
        'f1',
        { status: 'Approved' },
        fleetManager.userId,
      );

      expect(mockTransportRepository.resolveFuelLog).toHaveBeenCalledWith(
        'f1',
        {
          status: 'Approved',
          approvedBy: fleetManager.userId,
          rejectionReason: null,
        },
      );
    });
  });

  describe('resolveExpense', () => {
    it('throws NotFoundException when missing', async () => {
      mockTransportRepository.findExpenseById.mockResolvedValue(null);
      await expect(
        service.resolveExpense(
          'missing',
          { status: 'Approved' },
          fleetManager.userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when not Pending', async () => {
      mockTransportRepository.findExpenseById.mockResolvedValue({
        id: 'e1',
        status: 'Rejected',
      });
      await expect(
        service.resolveExpense(
          'e1',
          { status: 'Approved' },
          fleetManager.userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a pending expense with a reason', async () => {
      mockTransportRepository.findExpenseById.mockResolvedValue({
        id: 'e1',
        status: 'Pending',
      });
      mockTransportRepository.resolveExpense.mockResolvedValue({
        id: 'e1',
        status: 'Rejected',
      });

      await service.resolveExpense(
        'e1',
        { status: 'Rejected', rejectionReason: 'No receipt' },
        fleetManager.userId,
      );

      expect(mockTransportRepository.resolveExpense).toHaveBeenCalledWith(
        'e1',
        {
          status: 'Rejected',
          approvedBy: fleetManager.userId,
          rejectionReason: 'No receipt',
        },
      );
    });
  });

  describe('acknowledgeBreakdown / acknowledgeAccident', () => {
    it('only acknowledges a breakdown still in Reported status', async () => {
      mockTransportRepository.findBreakdownById.mockResolvedValue({
        id: 'b1',
        status: 'Resolved',
      });
      await expect(
        service.acknowledgeBreakdown('b1', fleetManager.userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('acknowledges a newly reported breakdown', async () => {
      mockTransportRepository.findBreakdownById.mockResolvedValue({
        id: 'b1',
        status: 'Reported',
      });
      mockTransportRepository.acknowledgeBreakdown.mockResolvedValue({
        id: 'b1',
        status: 'Acknowledged',
      });

      await service.acknowledgeBreakdown('b1', fleetManager.userId);

      expect(mockTransportRepository.acknowledgeBreakdown).toHaveBeenCalledWith(
        'b1',
        fleetManager.userId,
      );
    });

    it('only acknowledges an accident still Under Investigation', async () => {
      mockTransportRepository.findAccidentById.mockResolvedValue({
        id: 'a1',
        status: 'Closed',
      });
      await expect(
        service.acknowledgeAccident('a1', fleetManager.userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createOdometerLog / closeOdometerLog', () => {
    it('enforces vehicle ownership before creating', async () => {
      mockTransportOwnership.assertVehicleAccess.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.createOdometerLog({ vehicleId: 'v1' }, driver),
      ).rejects.toThrow(ForbiddenException);
      expect(mockTransportRepository.createOdometerLog).not.toHaveBeenCalled();
    });

    it('computes distanceTravelled from opening vs closing reading', async () => {
      mockTransportRepository.findOdometerLogById.mockResolvedValue({
        id: 'o1',
        openingReading: 100,
      });
      mockTransportRepository.closeOdometerLog.mockResolvedValue({ id: 'o1' });

      await service.closeOdometerLog('o1', { closingReading: 150 });

      expect(mockTransportRepository.closeOdometerLog).toHaveBeenCalledWith(
        'o1',
        {
          closingReading: 150,
          distanceTravelled: 50,
          remarks: undefined,
        },
      );
    });
  });

  describe('createDailyCheck', () => {
    it('marks overallStatus Fit when every checked item is true', async () => {
      mockTransportRepository.createDailyCheck.mockResolvedValue({ id: 'd1' });

      await service.createDailyCheck(
        { vehicleId: 'v1', brakesOk: true, tyresOk: true },
        driver,
      );

      expect(mockTransportRepository.createDailyCheck).toHaveBeenCalledWith(
        expect.objectContaining({ overallStatus: 'Fit' }),
      );
    });

    it('marks overallStatus Not Fit when any checked item is false', async () => {
      mockTransportRepository.createDailyCheck.mockResolvedValue({ id: 'd1' });

      await service.createDailyCheck(
        { vehicleId: 'v1', brakesOk: false },
        driver,
      );

      expect(mockTransportRepository.createDailyCheck).toHaveBeenCalledWith(
        expect.objectContaining({ overallStatus: 'Not Fit' }),
      );
    });
  });

  describe('createExpense', () => {
    it('requires vehicle ownership when a vehicleId is given', async () => {
      mockPrismaService.transportExpense.create.mockResolvedValue({ id: 'e1' });

      await service.createExpense({ vehicleId: 'v1' }, driver);

      expect(mockTransportOwnership.assertVehicleAccess).toHaveBeenCalledWith(
        driver,
        'v1',
      );
    });

    it('rejects a school-wide expense (no vehicleId) from a non-fleet role', async () => {
      await expect(service.createExpense({}, driver)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.transportExpense.create).not.toHaveBeenCalled();
    });

    it('allows a fleet manager to log a school-wide expense', async () => {
      mockPrismaService.transportExpense.create.mockResolvedValue({ id: 'e1' });

      await service.createExpense({}, fleetManager);

      expect(mockPrismaService.transportExpense.create).toHaveBeenCalled();
    });
  });

  describe('createRoute', () => {
    it('rejects an ownerless route from a non-fleet role', async () => {
      await expect(service.createRoute({}, driver)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('checks vehicle ownership when a driver supplies their own vehicleId', async () => {
      mockPrismaService.transportRoute.create.mockResolvedValue({ id: 'r1' });

      await service.createRoute({ vehicleId: 'v1' }, driver);

      expect(mockTransportOwnership.assertVehicleAccess).toHaveBeenCalledWith(
        driver,
        'v1',
      );
    });
  });

  describe('assignStudentToStop', () => {
    it('throws BadRequestException when neither routeId nor a resolvable stopId is given', async () => {
      await expect(
        service.assignStudentToStop('enr-1', undefined, {}, driver),
      ).rejects.toThrow(BadRequestException);
    });

    it('resolves the route from the stop when routeId is not supplied directly', async () => {
      mockTransportRepository.findStopById.mockResolvedValue({
        id: 'stop-1',
        routeId: 'route-1',
      });
      mockPrismaService.transportStudentAssignment.create.mockResolvedValue({
        id: 'sa-1',
      });

      await service.assignStudentToStop('enr-1', 'stop-1', {}, driver);

      expect(mockTransportOwnership.assertRouteAccess).toHaveBeenCalledWith(
        driver,
        'route-1',
      );
      expect(
        mockPrismaService.transportStudentAssignment.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            routeId: 'route-1',
            enrollmentId: 'enr-1',
          }),
        }),
      );
    });
  });

  describe('createTrip / updateTrip ownership', () => {
    it('createTrip checks ownership of the trip vehicle', async () => {
      mockPrismaService.transportTrip.create.mockResolvedValue({ id: 't1' });

      await service.createTrip(
        {
          vehicleId: 'v1',
          routeId: 'r1',
          tripType: 'Morning',
          date: '2026-08-04',
        },
        driver,
      );

      expect(mockTransportOwnership.assertVehicleAccess).toHaveBeenCalledWith(
        driver,
        'v1',
      );
    });

    it('updateTrip 404s when the trip does not exist', async () => {
      mockPrismaService.transportTrip.findUnique.mockResolvedValue(null);

      await expect(service.updateTrip('missing', {}, driver)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("updateTrip checks ownership against the trip's own vehicleId, not the request body", async () => {
      mockPrismaService.transportTrip.findUnique.mockResolvedValue({
        id: 't1',
        vehicleId: 'v1',
      });
      mockPrismaService.transportTrip.update.mockResolvedValue({ id: 't1' });

      await service.updateTrip('t1', { status: 'Completed' }, driver);

      expect(mockTransportOwnership.assertVehicleAccess).toHaveBeenCalledWith(
        driver,
        'v1',
      );
    });
  });

  describe('logFuel', () => {
    it('enforces vehicle ownership and still computes mileage', async () => {
      mockPrismaService.transportFuelLog.create.mockResolvedValue({ id: 'f1' });

      await service.logFuel(
        {
          vehicleId: 'v1',
          previousOdometer: 1000,
          currentOdometer: 1100,
          litres: 10,
        },
        driver,
      );

      expect(mockTransportOwnership.assertVehicleAccess).toHaveBeenCalledWith(
        driver,
        'v1',
      );
      expect(mockPrismaService.transportFuelLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mileage: 10 }),
        }),
      );
    });
  });

  describe('renderStudentBusPassPdf', () => {
    it('throws NotFoundException when the student has no active transport assignment', async () => {
      mockTransportRepository.findActiveTransportAssignmentForStudent.mockResolvedValue(
        null,
      );

      await expect(
        service.renderStudentBusPassPdf('student-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('renders and uploads a bus pass for an active assignment', async () => {
      mockTransportRepository.findActiveTransportAssignmentForStudent.mockResolvedValue(
        {
          id: 'assignment-1',
          enrollment: {
            student: {
              fullName: 'Asha Rao',
              admissionNumber: 'A-001',
              photoUrl: null,
            },
            section: { name: 'A', class: { grade: 'Grade 8' } },
          },
          route: {
            routeName: 'Route 4',
            vehicle: { busName: 'Bus 4', vehicleNumber: 'KA-01-1234' },
          },
          stop: {
            stopName: 'Green Park',
            arrivalTime: '07:30',
            departureTime: '15:30',
          },
        },
      );
      mockRenderer.renderBusPass.mockResolvedValue(Buffer.from('pdf'));
      mockStorage.uploadFile.mockResolvedValue({ url: 'https://storage/bus-pass.pdf' });

      const result = await service.renderStudentBusPassPdf('student-1');

      expect(mockRenderer.renderBusPass).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Asha Rao',
          className: 'Grade 8 - A',
          routeName: 'Route 4',
          stopName: 'Green Park',
          vehicleLabel: 'Bus 4',
        }),
      );
      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'bus-passes/student-1',
        'bus-pass-assignment-1.pdf',
        'application/pdf',
      );
      expect(result).toEqual({ url: 'https://storage/bus-pass.pdf' });
    });
  });
});
