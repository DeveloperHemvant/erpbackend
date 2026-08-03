import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID } from "class-validator";

export class CreateAssignmentDto {
  @ApiProperty({ example: "Math Homework 1" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: "Homework", required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: "2026-07-25" })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @IsOptional()
  maxMarks?: number;

  @ApiProperty({ example: "Solve chapters 3 and 4.", required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
