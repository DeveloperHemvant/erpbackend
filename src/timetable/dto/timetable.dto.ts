import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class CreateTimetableDto {
  @ApiProperty({ example: "Summer Session Timetable" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: "Active", required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateTimetablePeriodDto {
  @IsUUID()
  @IsNotEmpty()
  timetableId: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: "e936551b-4d43-4011-8fe6-b3334863adfb" })
  @IsUUID()
  @IsNotEmpty()
  assignmentId: string;

  @ApiProperty({ example: "Monday" })
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({ example: "09:00" })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: "10:00" })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: "Room 102" })
  @IsString()
  @IsNotEmpty()
  room: string;
}
