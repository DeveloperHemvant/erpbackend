import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class UpsertHealthProfileDto {
  @IsString() @IsOptional() bloodGroup?: string;
  @IsString() @IsOptional() allergies?: string;
  @IsString() @IsOptional() chronicConditions?: string;
  @IsString() @IsOptional() currentMedications?: string;
  @IsString() @IsOptional() emergencyContactName?: string;
  @IsString() @IsOptional() emergencyContactPhone?: string;
  @IsString() @IsOptional() familyDoctorName?: string;
  @IsString() @IsOptional() familyDoctorPhone?: string;
  @IsString() @IsOptional() insuranceProvider?: string;
  @IsString() @IsOptional() insurancePolicyNo?: string;
  @IsString() @IsOptional() notes?: string;
}

export class CreateHealthVisitDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  symptoms?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  treatmentGiven?: string;

  @IsIn([
    'Observed and Released',
    'Sent Home',
    'Referred to Doctor',
    'Hospitalized',
  ])
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  notifyParent?: boolean;
}

export class CreateVaccinationDto {
  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @IsInt()
  @IsOptional()
  doseNumber?: number;

  @IsString()
  @IsNotEmpty()
  dateAdministered: string;

  @IsString()
  @IsOptional()
  nextDueDate?: string;

  @IsString()
  @IsOptional()
  administeredBy?: string;

  @IsString()
  @IsOptional()
  certificateUrl?: string;
}
