import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransportOwnershipService } from './transport-ownership.service';
import { TransportRepository } from './repositories/transport.repository';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('TransportOwnershipService', () => {
  let service: TransportOwnershipService;

  const mockTransportRepository = {
    findVehicleStaffAssignment: jest.fn(),
    findRouteById: jest.fn(),
    findStopById: jest.fn(),
    findVehicleIdsForStaff: jest.fn(),
  };

  const driver: AuthenticatedUser = {
    userId: 'driver-1',
    identifier: 'driver@school.test',
    role: 'Driver',
    permissions: ['MANAGE_TRANSPORT'],
  };
  const fleetManager: AuthenticatedUser = {
    userId: 'mgr-1',
    identifier: 'mgr@school.test',
    role: 'Transport Manager',
    permissions: ['MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET'],
  };
  const superAdmin: AuthenticatedUser = {
    userId: 'admin-1',
    identifier: 'admin@school.test',
    role: 'Super Admin',
    permissions: ['*'],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportOwnershipService,
        { provide: TransportRepository, useValue: mockTransportRepository },
      ],
    }).compile();

    service = module.get<TransportOwnershipService>(TransportOwnershipService);
  });

  describe('assertVehicleAccess', () => {
    it('allows a fleet-wide role without checking assignment', async () => {
      await service.assertVehicleAccess(fleetManager, 'vehicle-1');
      expect(
        mockTransportRepository.findVehicleStaffAssignment,
      ).not.toHaveBeenCalled();
    });

    it('allows the "*" wildcard role without checking assignment', async () => {
      await service.assertVehicleAccess(superAdmin, 'vehicle-1');
      expect(
        mockTransportRepository.findVehicleStaffAssignment,
      ).not.toHaveBeenCalled();
    });

    it('allows a driver who is assigned to the vehicle', async () => {
      mockTransportRepository.findVehicleStaffAssignment.mockResolvedValue({
        id: 'assign-1',
        staffId: driver.userId,
        vehicleId: 'vehicle-1',
      });

      await expect(
        service.assertVehicleAccess(driver, 'vehicle-1'),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException for a driver not assigned to the vehicle', async () => {
      mockTransportRepository.findVehicleStaffAssignment.mockResolvedValue(
        null,
      );

      await expect(
        service.assertVehicleAccess(driver, 'someone-elses-vehicle'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertRouteAccess', () => {
    it('throws NotFoundException when the route does not exist', async () => {
      mockTransportRepository.findRouteById.mockResolvedValue(null);

      await expect(
        service.assertRouteAccess(driver, 'missing-route'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for an ownerless route unless the caller has fleet access', async () => {
      mockTransportRepository.findRouteById.mockResolvedValue({
        id: 'route-1',
        vehicleId: null,
      });

      await expect(
        service.assertRouteAccess(driver, 'route-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a fleet manager to access an ownerless route', async () => {
      mockTransportRepository.findRouteById.mockResolvedValue({
        id: 'route-1',
        vehicleId: null,
      });

      await expect(
        service.assertRouteAccess(fleetManager, 'route-1'),
      ).resolves.toBeUndefined();
    });

    it("delegates to assertVehicleAccess using the route's vehicleId", async () => {
      mockTransportRepository.findRouteById.mockResolvedValue({
        id: 'route-1',
        vehicleId: 'vehicle-1',
      });
      mockTransportRepository.findVehicleStaffAssignment.mockResolvedValue(
        null,
      );

      await expect(
        service.assertRouteAccess(driver, 'route-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(
        mockTransportRepository.findVehicleStaffAssignment,
      ).toHaveBeenCalledWith(driver.userId, 'vehicle-1');
    });
  });

  describe('assertStopAccess', () => {
    it('throws NotFoundException when the stop does not exist', async () => {
      mockTransportRepository.findStopById.mockResolvedValue(null);

      await expect(
        service.assertStopAccess(driver, 'missing-stop'),
      ).rejects.toThrow(NotFoundException);
    });

    it("delegates to assertRouteAccess using the stop's routeId", async () => {
      mockTransportRepository.findStopById.mockResolvedValue({
        id: 'stop-1',
        routeId: 'route-1',
      });
      mockTransportRepository.findRouteById.mockResolvedValue({
        id: 'route-1',
        vehicleId: 'vehicle-1',
      });
      mockTransportRepository.findVehicleStaffAssignment.mockResolvedValue({
        id: 'assign-1',
      });

      await expect(
        service.assertStopAccess(driver, 'stop-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getOwnedVehicleIds', () => {
    it('delegates straight to the repository', async () => {
      mockTransportRepository.findVehicleIdsForStaff.mockResolvedValue([
        'v1',
        'v2',
      ]);

      const result = await service.getOwnedVehicleIds(driver.userId);

      expect(result).toEqual(['v1', 'v2']);
      expect(
        mockTransportRepository.findVehicleIdsForStaff,
      ).toHaveBeenCalledWith(driver.userId);
    });
  });
});
