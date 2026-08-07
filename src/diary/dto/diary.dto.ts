import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateDiaryEntryDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  type: string; // HOMEWORK, REMARK, ANNOUNCEMENT, DIRECTIVE

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateNewsItemDto {
  @IsString()
  @IsNotEmpty()
  national: string;

  @IsString()
  @IsNotEmpty()
  international: string;

  @IsString()
  @IsNotEmpty()
  sports: string;

  @IsString()
  @IsNotEmpty()
  weather: string;

  @IsString()
  @IsOptional()
  importantDay?: string;

  @IsString()
  @IsOptional()
  festival?: string;
}

export class CreateLostFoundDto {
  @IsString()
  @IsNotEmpty()
  status: string; // LOST, FOUND

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class CreateDocumentLifecycleDto {
  @IsString()
  @IsNotEmpty()
  entityType: string; // VEHICLE, STAFF, STUDENT

  @IsUUID()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  docType: string; // FITNESS, INSURANCE, LICENSE, MEDICAL

  @IsString()
  @IsOptional()
  docNumber?: string;

  @IsDateString()
  expiryDate: string;

  @IsInt()
  @IsOptional()
  alertDays?: number;
}
