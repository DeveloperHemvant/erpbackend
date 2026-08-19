import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsNumber,
} from 'class-validator';

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

  // Optional for the same reason as CreatePurchaseRequisitionDto.campusId
  // below: campus-fixed staff never need to send this, the controller fills
  // it in from the authenticated user's own campusId.
  @IsUUID()
  @IsOptional()
  campusId?: string;

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
  // Optional: campus-fixed staff never need to send this - the controller
  // fills it in from the authenticated user's own campusId. Only a
  // canAccessAllCampuses user (who has no fixed campus) must pick one
  // explicitly.
  @IsUUID()
  @IsOptional()
  campusId?: string;

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

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  quantity?: number;
}

export class UpdatePurchaseRequisitionStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // Pending, Approved, Ordered, Received, Rejected
}
