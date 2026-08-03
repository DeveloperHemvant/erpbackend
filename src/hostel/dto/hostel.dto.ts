import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt } from "class-validator";

export class CreateHostelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  warden?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class AddHostelRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsInt()
  @IsNotEmpty()
  capacity: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class AllocateRoomDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;
}

export class FileGrievanceDto {
  @IsUUID()
  @IsNotEmpty()
  hostelId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
