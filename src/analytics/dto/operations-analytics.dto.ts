import { ApiProperty } from '@nestjs/swagger';

export class TripStatusCountDto {
  @ApiProperty({ example: 'In Progress' }) status: string;
  @ApiProperty({ example: 8 }) count: number;
}

export class VehicleStatusCountDto {
  @ApiProperty({ example: 'Active' }) status: string;
  @ApiProperty({ example: 28 }) count: number;
}

/** Refresh: 30s. GPS is confirmed manual-ping, not a hardware feed — this
 * intentionally reports trip *status*, never a live map. */
export class FleetStatusDto {
  @ApiProperty({ type: [TripStatusCountDto] })
  tripsToday: TripStatusCountDto[];

  @ApiProperty({ type: [VehicleStatusCountDto] })
  vehiclesByStatus: VehicleStatusCountDto[];

  @ApiProperty({ example: 1, description: 'TransportBreakdown rows still Reported/Acknowledged/Under Repair' })
  openBreakdowns: number;
}

/** Refresh: 15 min. Last 30 days, `status=Approved` fuel logs only (excludes
 * logs still pending sign-off, so this reflects confirmed cost/usage). */
export class FuelUsageDto {
  @ApiProperty({ example: 4820.5 }) totalLitres: number;
  @ApiProperty({ example: 512400 }) totalCost: number;
  @ApiProperty({ example: 9.4, nullable: true, description: 'Average of logs with a computed mileage value; null if none have one yet' })
  avgMileage: number | null;
  @ApiProperty({ example: 62 }) logCount: number;
}

export class DisciplineBucketDto {
  @ApiProperty({ example: 'Major' }) label: string;
  @ApiProperty({ example: 2 }) count: number;
}

export class RecentDisciplineIncidentDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Aarav Sharma' }) studentName: string;
  @ApiProperty({ example: 'Disruption' }) category: string;
  @ApiProperty({ example: 'Minor' }) severity: string;
  @ApiProperty({ example: 'Open' }) status: string;
  @ApiProperty() incidentDate: string;
}

/** Refresh: 5 min. */
export class DisciplineBreakdownDto {
  @ApiProperty({ example: 3 }) openCount: number;
  @ApiProperty({ type: [DisciplineBucketDto] }) bySeverity: DisciplineBucketDto[];
  @ApiProperty({ type: [DisciplineBucketDto] }) byCategory: DisciplineBucketDto[];
  @ApiProperty({ type: [RecentDisciplineIncidentDto] }) recent: RecentDisciplineIncidentDto[];
}

export class HostelByGroupDto {
  @ApiProperty({ example: 'Boys Hostel A' }) name: string;
  @ApiProperty({ example: 40 }) capacity: number;
  @ApiProperty({ example: 34 }) occupied: number;
  @ApiProperty({ example: 85 }) occupancyRate: number;
}

/** Refresh: 15 min. */
export class HostelOccupancyDto {
  @ApiProperty({ example: 320 }) totalCapacity: number;
  @ApiProperty({ example: 271 }) totalOccupied: number;
  @ApiProperty({ example: 85 }) occupancyRate: number;
  @ApiProperty({ type: [HostelByGroupDto] }) byHostel: HostelByGroupDto[];
}

/** Refresh: 30s. `StudentGatePass` has no distinct "pending approval" state —
 * `approvedById` is required at creation, so every pass is already approved
 * when issued; "currently out" (status=Approved, no returnTime) is the real
 * operationally-relevant state, not a pending queue. */
export class GatePassesDto {
  @ApiProperty({ example: 12 }) issuedToday: number;
  @ApiProperty({ example: 4 }) currentlyOut: number;
}

export class RecentMedicalVisitDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Diya Patel' }) studentName: string;
  @ApiProperty({ example: 'Headache' }) reason: string;
  @ApiProperty({ example: 'Observed and Released' }) actionTaken: string;
  @ApiProperty() visitDate: string;
}

/** Refresh: 5 min. No severity/emergency field exists on HealthVisit — this
 * reports visit count and the real `actionTaken` categorization only, never
 * a fabricated "emergency" flag. See RC1_IMPLEMENTATION_PLAN.md Pending KPIs. */
export class MedicalRoomDto {
  @ApiProperty({ example: 3 }) visitsToday: number;
  @ApiProperty({ type: [RecentMedicalVisitDto] }) recent: RecentMedicalVisitDto[];
}
