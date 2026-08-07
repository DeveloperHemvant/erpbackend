import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMedicalVisitDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  symptoms: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  medicineIssued?: string;

  @IsString()
  @IsOptional()
  referredToDoctor?: string;
}
