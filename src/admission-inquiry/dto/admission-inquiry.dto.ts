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

// Phase 3 item 3.4 — the actual fix for "Applicant -> Student is a manual,
// disconnected step." ConvertInquiryDto (above) assumes a Student was
// already created elsewhere and just links an ID; this creates the Student
// AND links it in one call, pre-filled from the inquiry so staff don't
// re-type name/guardian/phone they already captured at inquiry time.
export class ConvertAndCreateStudentDto {
  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsEmail()
  @IsNotEmpty()
  parentEmail: string; // required by StudentsService.createStudent for portal account setup; inquiry.email is optional, so this can't always be silently defaulted

  @IsString() @IsOptional() fullName?: string; // defaults to inquiry.childName
  @IsString() @IsOptional() guardianName?: string; // defaults to inquiry.parentName
  @IsString() @IsOptional() phone?: string; // defaults to inquiry.phone

  @IsUUID() @IsOptional() classId?: string;
  @IsUUID() @IsOptional() sectionId?: string;
}
