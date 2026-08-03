import { PartialType } from "@nestjs/swagger";
import { CreateRoleDto } from "./create-role.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiProperty({ description: "The actor performing this update", example: "admin@school.com", required: false })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}
