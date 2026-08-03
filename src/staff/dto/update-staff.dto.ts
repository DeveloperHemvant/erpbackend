import { PartialType } from "@nestjs/swagger";
import { CreateStaffDto } from "./create-staff.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiProperty({ description: "The actor performing this update", example: "admin@school.com", required: false })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}
