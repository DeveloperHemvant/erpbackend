import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";

export class CreateDocumentTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(["ID_CARD", "CERTIFICATE"])
  @IsNotEmpty()
  type: string;

  @IsIn(["STAFF", "STUDENT"])
  @IsNotEmpty()
  targetAudience: string;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateDocumentTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsIn(["ID_CARD", "CERTIFICATE"])
  @IsOptional()
  type?: string;

  @IsIn(["STAFF", "STUDENT"])
  @IsOptional()
  targetAudience?: string;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsOptional()
  status?: string;
}
