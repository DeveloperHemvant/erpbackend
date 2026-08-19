import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsIn,
} from 'class-validator';

export const ACMS_EVENT_TYPES = [
  'ACADEMIC',
  'SPORTS',
  'CULTURAL',
  'TRIP',
  'COMPETITION',
  'EXHIBITION',
  'OLYMPIAD',
  'SEMINAR',
  'TOUR',
] as const;

export class CreateAcademicTermDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  campusId?: string;
}

export class CreateWorkingDayDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsInt()
  @IsNotEmpty()
  dayOfWeek: number;

  @IsBoolean()
  @IsOptional()
  isWorkingDay?: boolean;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;
}

export class UpdateWorkingDayDto {
  @IsBoolean()
  @IsOptional()
  isWorkingDay?: boolean;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;
}

export class CreateAcmsEventDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsOptional()
  campusId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsIn(ACMS_EVENT_TYPES)
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateAcmsEventDto {
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsUUID()
  @IsOptional()
  campusId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsIn(ACMS_EVENT_TYPES)
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreateResourceBookingDto {
  @IsString()
  @IsNotEmpty()
  resourceName: string;

  @IsString()
  @IsNotEmpty()
  bookedBy: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  status?: string;
}
