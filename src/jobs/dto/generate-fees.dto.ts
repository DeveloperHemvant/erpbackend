import { IsString, IsNotEmpty, IsUUID } from "class-validator";

export class GenerateFeesDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsUUID()
  @IsNotEmpty()
  campusId: string;
}
