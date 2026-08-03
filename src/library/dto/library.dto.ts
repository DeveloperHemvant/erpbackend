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
