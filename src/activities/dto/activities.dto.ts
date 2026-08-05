import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsInt, IsArray } from "class-validator";

export class CreateAssemblyDto {
  @IsDateString()
  date: string;

  @IsUUID()
  campusId: string;

  @IsString()
  @IsNotEmpty()
  theme: string;

  @IsUUID()
  performingSectionId: string;

  @IsUUID()
  supervisingStaffId: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsArray()
  activities: any[]; // [{ type: 'PRAYER'|'SPEECH'|'INSTRUMENT'|'SINGING', studentId: string, details?: string }]
}

export class CreateSchoolEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string; // COMPETITION, EXHIBITION, OLYMPIAD, SEMINAR, TOUR

  @IsDateString()
  date: string;

  @IsUUID()
  campusId: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AwardHousePointsDto {
  @IsInt()
  points: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateStudentAchievementDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  type: string; // ACADEMIC, SPORTS, MUSIC, DANCE, DEBATE, OLYMPIAD

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  award: string; // MEDAL, TROPHY, CERTIFICATE, SCHOLARSHIP
}

export class CreateStaffDutyDto {
  @IsUUID()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  dutyType: string; // EXAM, ASSEMBLY, PTM, SPORTS, GATE, BUS

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
