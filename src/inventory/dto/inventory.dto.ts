import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsNumber } from "class-validator";

export class CreateAssetCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateAssetDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  campusId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreatePurchaseRequisitionDto {
  @IsUUID()
  @IsNotEmpty()
  campusId: string;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
