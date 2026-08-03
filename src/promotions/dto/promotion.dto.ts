import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsArray, Min, Max } from "class-validator";

export class PreviewPromotionDto {
  @IsUUID()
  @IsNotEmpty()
  fromSessionId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passThreshold?: number;
}

export class CommitPromotionDto {
  @IsUUID()
  @IsNotEmpty()
  fromSessionId: string;

  @IsUUID()
  @IsOptional()
  toSessionId?: string;

  @IsString()
  @IsOptional()
  toSessionName?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passThreshold?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  holdBackStudentIds?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  forcePromoteStudentIds?: string[];
}
