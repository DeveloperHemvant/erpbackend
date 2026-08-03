import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from "class-validator";

export class CreateDisciplineIncidentDto {
  @IsIn(["Bullying", "Disruption", "Academic Dishonesty", "Property Damage", "Attendance", "Other"])
  @IsNotEmpty()
  category: string;

  @IsIn(["Minor", "Moderate", "Major"])
  @IsOptional()
  severity?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(["Verbal Warning", "Written Warning", "Detention", "Suspension", "Parent Meeting", "Counseling Referral"])
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  notifyParent?: boolean;
}

export class UpdateDisciplineIncidentDto {
  @IsIn(["Open", "Resolved", "Escalated"])
  @IsOptional()
  status?: string;

  @IsIn(["Verbal Warning", "Written Warning", "Detention", "Suspension", "Parent Meeting", "Counseling Referral"])
  @IsOptional()
  actionTaken?: string;
}

export class AddCounselingNoteDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
