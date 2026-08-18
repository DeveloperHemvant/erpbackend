import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateDocumentTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // 'ID_CARD' was removed - IdCardTemplate/IdCard is the real, wired-up ID
  // card flow; a DocumentTemplate of that type had no downstream consumer.
  @IsIn(['CERTIFICATE'])
  @IsNotEmpty()
  type: string;

  @IsIn(['STAFF', 'STUDENT'])
  @IsNotEmpty()
  targetAudience: string;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsOptional()
  status?: string;
}

export class IssueCertificateDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  type: string; // MERIT, PARTICIPATION, COMPLETION, ...

  @IsString()
  @IsNotEmpty()
  title: string;
}

export class RequestCertificateDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsIn(['BONAFIDE', 'TRANSFER', 'MIGRATION'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}

export class ApproveCertificateRequestDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;
}

export class UpdateDocumentTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(['CERTIFICATE'])
  @IsOptional()
  type?: string;

  @IsIn(['STAFF', 'STUDENT'])
  @IsOptional()
  targetAudience?: string;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsOptional()
  status?: string;
}
