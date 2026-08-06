import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsNumber,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @IsString()
  @IsOptional()
  internalBusCode?: string;

  @IsString()
  @IsOptional()
  busName?: string;

  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  manufacturingYear?: number;

  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  engineNumber?: string;

  @IsString()
  @IsOptional()
  chassisNumber?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsInt()
  @IsNotEmpty()
  seatingCapacity: number;

  @IsInt()
  @IsOptional()
  standingCapacity?: number;

  @IsNumber()
  @IsOptional()
  currentOdometer?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  fuelType?: string;

  @IsString()
  @IsOptional()
  transmission?: string;

  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @IsString()
  @IsOptional()
  insurancePolicyNumber?: string;

  @IsString()
  @IsOptional()
  insuranceExpiry?: string;

  @IsString()
  @IsOptional()
  roadTaxExpiry?: string;

  @IsString()
  @IsOptional()
  fitnessCertificate?: string;

  @IsString()
  @IsOptional()
  permitNumber?: string;

  @IsString()
  @IsOptional()
  permitExpiry?: string;

  @IsString()
  @IsOptional()
  pollutionCertificate?: string;

  @IsString()
  @IsOptional()
  fireExtinguisherExpiry?: string;

  @IsBoolean()
  @IsOptional()
  gpsDevice?: boolean;

  @IsBoolean()
  @IsOptional()
  rfidDevice?: boolean;

  @IsBoolean()
  @IsOptional()
  cameraInstalled?: boolean;

  @IsBoolean()
  @IsOptional()
  panicButton?: boolean;

  @IsBoolean()
  @IsOptional()
  firstAidKit?: boolean;

  @IsBoolean()
  @IsOptional()
  speedGovernorInstalled?: boolean;

  @IsBoolean()
  @IsOptional()
  wheelchairAccessible?: boolean;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

export class AssignStaffDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  shift: string;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  routeName: string;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @IsString()
  @IsOptional()
  morningStartTime?: string;

  @IsString()
  @IsOptional()
  afternoonStartTime?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;
}

export class AddRouteStopDto {
  @IsString()
  @IsNotEmpty()
  stopName: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  arrivalTime?: string;

  @IsString()
  @IsOptional()
  departureTime?: string;

  @IsNumber()
  @IsOptional()
  distanceFromPrev?: number;

  @IsInt()
  @IsNotEmpty()
  orderIndex: number;
}

export class AssignStudentToStopDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsUUID()
  @IsOptional()
  stopId?: string;

  @IsUUID()
  @IsOptional()
  routeId?: string;

  @IsBoolean()
  @IsOptional()
  morningPickup?: boolean;

  @IsBoolean()
  @IsOptional()
  afternoonDrop?: boolean;

  @IsString()
  @IsOptional()
  seatNumber?: string;

  @IsString()
  @IsOptional()
  feePeriod?: string;

  @IsString()
  @IsOptional()
  guardianAuth?: string;
}

export class CreateTripDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsNotEmpty()
  tripType: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsOptional()
  startOdometer?: number;

  @IsNumber()
  @IsOptional()
  endOdometer?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateTripDto extends PartialType(CreateTripDto) {}

export class LogTripLocationDto {
  @IsUUID()
  @IsOptional()
  stopId?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  speed?: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class MarkTransportAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  markedBy: string;

  @IsUUID()
  @IsOptional()
  stopId?: string;
}

export class LogFuelDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  fuelStation?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @IsNumber()
  @IsNotEmpty()
  litres: number;

  @IsNumber()
  @IsNotEmpty()
  ratePerLitre: number;

  @IsNumber()
  @IsNotEmpty()
  totalCost: number;

  @IsNumber()
  @IsNotEmpty()
  currentOdometer: number;

  @IsNumber()
  @IsOptional()
  previousOdometer?: number;

  @IsString()
  @IsOptional()
  filledBy?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateTransportServiceDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  serviceDate: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsNumber()
  @IsNotEmpty()
  odometerReading: number;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  mechanicName?: string;

  @IsNumber()
  @IsOptional()
  totalCost?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  invoiceUrl?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  nextServiceDate?: string;

  @IsNumber()
  @IsOptional()
  nextServiceOdo?: number;
}

export class CreateTyreDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  tyreNumber: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  installedDate: string;

  @IsNumber()
  @IsNotEmpty()
  installedOdo: number;

  @IsNumber()
  @IsOptional()
  currentOdo?: number;

  @IsNumber()
  @IsOptional()
  treadDepth?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  warrantyExpiry?: string;
}

export class CreateBatteryDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  batteryNumber: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsString()
  @IsNotEmpty()
  installedDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  warrantyExpiry?: string;
}

export class ReportBreakdownDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  towingRequired?: boolean;

  @IsNumber()
  @IsOptional()
  costIncurred?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class ReportAccidentDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  policeReport?: boolean;

  @IsString()
  @IsOptional()
  firNumber?: string;

  @IsBoolean()
  @IsOptional()
  insuranceClaimed?: boolean;

  @IsNumber()
  @IsOptional()
  claimAmount?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateTransportVendorDto {
  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  vendorType: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateTransportExpenseDto {
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMode: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

// --- Odometer logs ---
export class CreateOdometerLogDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  openingReading: number;

  @IsNumber()
  @IsOptional()
  closingReading?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateOdometerLogDto {
  @IsNumber()
  @IsNotEmpty()
  closingReading: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

// --- Pre-trip daily safety check ---
export class CreateDailyCheckDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  shift: string;

  @IsUUID()
  @IsOptional()
  tripId?: string;

  @IsBoolean()
  @IsOptional()
  brakesOk?: boolean;

  @IsBoolean()
  @IsOptional()
  tyresOk?: boolean;

  @IsBoolean()
  @IsOptional()
  lightsIndicatorsOk?: boolean;

  @IsBoolean()
  @IsOptional()
  hornOk?: boolean;

  @IsBoolean()
  @IsOptional()
  firstAidKitOk?: boolean;

  @IsBoolean()
  @IsOptional()
  fireExtinguisherOk?: boolean;

  @IsBoolean()
  @IsOptional()
  fuelLevelOk?: boolean;

  @IsNumber()
  @IsOptional()
  odometerReading?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

// --- Fuel / expense approval ---
export class ResolveFuelLogDto {
  @IsIn(['Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ResolveTransportExpenseDto {
  @IsIn(['Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

// --- Incident acknowledgment ---
export class AcknowledgeIncidentDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}
