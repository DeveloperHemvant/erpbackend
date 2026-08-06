import { IsUUID, IsDateString } from 'class-validator';

export class CreateSubstitutionDto {
  @IsUUID()
  leaveApplicationId: string;

  @IsUUID()
  primaryTeacherId: string;

  @IsUUID()
  substituteTeacherId: string;

  @IsDateString()
  date: string;

  @IsUUID()
  timetablePeriodId: string;
}
