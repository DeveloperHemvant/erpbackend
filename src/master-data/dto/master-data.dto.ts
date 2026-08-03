import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsInt, IsUUID } from "class-validator";

export class CreateSessionDto {
  @ApiProperty({ example: "2026-2027" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCampusDto {
  @ApiProperty({ example: "Main HQ Campus" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "742 Evergreen Terrace" })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: "1200" })
  @IsString()
  @IsNotEmpty()
  capacity: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb", required: false })
  @IsString()
  @IsOptional()
  schoolProfileId?: string;
}

export class CreateClassDto {
  @ApiProperty({ example: "Grade 10" })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsNotEmpty()
  campusId: string;

  @ApiProperty({ example: "UUID", description: "Academic session ID" })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: ["A", "B", "C"] })
  @IsArray()
  @IsString({ each: true })
  sections: string[];
}

export class CreateSubjectDto {
  @ApiProperty({ example: "Mathematics" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: "English" })
  @IsString()
  @IsNotEmpty()
  medium: string;
}

export class CreateAssignmentDto {
  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ example: "14 hrs/week" })
  @IsString()
  @IsOptional()
  workload?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
export class UpdateCampusDto extends PartialType(CreateCampusDto) {}
export class UpdateClassDto extends PartialType(CreateClassDto) {}
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
