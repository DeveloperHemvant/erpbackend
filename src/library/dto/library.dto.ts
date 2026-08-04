import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID } from "class-validator";

export class CreateLibraryBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @IsOptional()
  totalCopies?: number;

  @IsInt()
  @IsOptional()
  available?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class IssueBookDto {
  @IsUUID()
  @IsNotEmpty()
  bookId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;
}

export class CreateLibraryReservationDto {
  @IsUUID()
  @IsNotEmpty()
  bookId: string;

  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsOptional()
  expiresAt?: string; // ISO date-time or YYYY-MM-DD
}

export class FulfillReservationDto {
  @IsString()
  @IsNotEmpty()
  dueDate: string; // YYYY-MM-DD
}

export class UpdateFineStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Paid | Waived
}
