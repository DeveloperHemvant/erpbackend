import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UploadAttachmentDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsUUID()
  entityId: string;
}
