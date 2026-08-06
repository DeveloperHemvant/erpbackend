import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsUUID,
  IsEmail,
} from 'class-validator';

export class CreateInquiryDto {
  @IsString() @IsNotEmpty() childName: string;
  @IsString() @IsNotEmpty() gradeInterested: string;
  @IsString() @IsNotEmpty() parentName: string;
  @IsString() @IsNotEmpty() phone: string;

  @IsEmail() @IsOptional() email?: string;

  @IsIn(['Walk-in', 'Website', 'Referral', 'Phone', 'Social Media', 'Other'])
  @IsOptional()
  source?: string;

  @IsString() @IsOptional() notes?: string;

  @IsUUID() @IsOptional() assignedToStaffId?: string;
}

export class UpdateInquiryDto {
  @IsIn([
    'New',
    'Contacted',
    'Campus Visit Scheduled',
    'Application Sent',
    'Converted',
    'Lost',
  ])
  @IsOptional()
  status?: string;

  @IsUUID() @IsOptional() assignedToStaffId?: string;
  @IsString() @IsOptional() notes?: string;
}

export class AddFollowUpDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}

export class ConvertInquiryDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;
}
