import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEmail, IsUUID, IsOptional, IsIn } from "class-validator";

export class CreateStaffDto {
  @ApiProperty({ description: "Official email address of the staff member", example: "sarah.carson@school.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Full legal name of the educator or staff", example: "Prof. Sarah Carson" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: "Secure password for login", example: "StaffSecurePass123!", required: false })
  @IsString()
  @IsOptional()
  passwordHash?: string; // The service will hash this or generate one if not provided

  @ApiProperty({ description: "UUID target of the role mapping", example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ description: "Active status of the staff member", example: "Active", enum: ["Active", "Inactive", "Suspended"] })
  @IsString()
  @IsOptional()
  @IsIn(["Active", "Inactive", "Suspended"])
  status?: string;

  @ApiProperty({ description: "The actor performing this creation", example: "admin@school.com", required: false })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({ description: "Optional metadata such as subject expertise or class ranges", required: false })
  @IsOptional()
  details?: any;
}
