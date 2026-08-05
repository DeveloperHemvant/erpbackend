import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID, IsEmail } from "class-validator";

export class CreateStudentDto {
  @ApiProperty({ example: "ADM-2026-0001" })
  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @ApiProperty({ example: "Rahul Sharma" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: "Male" })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: "Amit Sharma" })
  @IsString()
  @IsNotEmpty()
  guardianName: string;

  @ApiProperty({ example: "+91 98765 43210" })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: "Draft" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: "some-class-uuid", required: false })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiProperty({ example: "some-section-uuid", required: false })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ example: "some-house-uuid", required: false })
  @IsUUID()
  @IsOptional()
  houseId?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  documentsVerified?: boolean;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  details?: any;
}

export class UpdateStudentDto {
  @ApiProperty({ example: "Rahul Sharma", required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: "Male", required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: "Amit Sharma", required: false })
  @IsString()
  @IsOptional()
  guardianName?: string;

  @ApiProperty({ example: "+91 98765 43210", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "Draft", required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: "some-class-uuid", required: false })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiProperty({ example: "some-section-uuid", required: false })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ example: "some-house-uuid", required: false })
  @IsUUID()
  @IsOptional()
  houseId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  documentsVerified?: boolean;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  details?: any;
}

export class UpdateParentCredentialsDto {
  @ApiProperty({ example: "parent@example.com", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "NewPassword123", required: false })
  @IsString()
  @IsOptional()
  password?: string;
}

export class SetupParentPortalDto {
  @ApiProperty({ example: "parent@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Parent@1234", required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: "Father", required: false })
  @IsString()
  @IsOptional()
  relationship?: string;
}
