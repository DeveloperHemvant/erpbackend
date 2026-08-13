import { IsString, IsNotEmpty } from 'class-validator';

export class UploadAdmissionDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string; // e.g. "Birth Certificate", "Transfer Certificate", "Aadhaar Card"
}
