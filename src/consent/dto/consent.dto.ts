import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateConsentRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(['ALL', 'SECTION', 'STUDENT'])
  targetType: 'ALL' | 'SECTION' | 'STUDENT';

  @IsUUID()
  @IsOptional()
  targetSectionId?: string;

  @IsUUID()
  @IsOptional()
  targetStudentId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
