import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { TransportRepository } from "./repositories/transport.repository";
import type { AuthenticatedUser } from "../auth/current-user.decorator";

// A driver/conductor may only create or modify transport records for a vehicle
// they're actively assigned to (TransportVehicleStaff, status "Assigned").
// Fleet-wide roles ('*' or MANAGE_TRANSPORT_FLEET) bypass the ownership check.
@Injectable()
export class TransportOwnershipService {
  constructor(private readonly transportRepository: TransportRepository) {}

  private hasFleetAccess(user: AuthenticatedUser): boolean {
    return user.permissions.includes("*") || user.permissions.includes("MANAGE_TRANSPORT_FLEET");
  }

  async getOwnedVehicleIds(staffId: string): Promise<string[]> {
    return this.transportRepository.findVehicleIdsForStaff(staffId);
  }

  async assertVehicleAccess(user: AuthenticatedUser, vehicleId: string): Promise<void> {
    if (this.hasFleetAccess(user)) return;

    const assignment = await this.transportRepository.findVehicleStaffAssignment(user.userId, vehicleId);
    if (!assignment) {
      throw new ForbiddenException("You are not assigned to this vehicle.");
    }
  }

  async assertRouteAccess(user: AuthenticatedUser, routeId: string): Promise<void> {
    if (this.hasFleetAccess(user)) return;

    const route = await this.transportRepository.findRouteById(routeId);
    if (!route) throw new NotFoundException("Route not found.");

    if (!route.vehicleId) {
      // An ownerless route can only be managed by fleet-wide roles.
      throw new ForbiddenException("This route has no assigned vehicle — only a transport manager can edit it.");
    }
    await this.assertVehicleAccess(user, route.vehicleId);
  }

  async assertStopAccess(user: AuthenticatedUser, stopId: string): Promise<void> {
    if (this.hasFleetAccess(user)) return;

    const stop = await this.transportRepository.findStopById(stopId);
    if (!stop) throw new NotFoundException("Stop not found.");
    await this.assertRouteAccess(user, stop.routeId);
  }
}
