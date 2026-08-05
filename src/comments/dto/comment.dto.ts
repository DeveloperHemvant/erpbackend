import { IsString, IsNotEmpty, IsUUID } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
