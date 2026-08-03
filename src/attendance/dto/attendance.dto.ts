import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from "class-validator";

export class CreateAttendanceDto {
  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb", required: false })
  @IsUUID()
  @IsOptional()
  enrollmentId?: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb", required: false })
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @ApiProperty({ example: "2026-07-19" })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: "Present", enum: ["Present", "Absent", "Late"] })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  faceVerified?: boolean;

  @ApiProperty({ example: "28.6139° N, 77.2090° E", required: false })
  @IsString()
  @IsOptional()
  location?: string;
}
