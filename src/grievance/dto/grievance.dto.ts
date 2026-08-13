import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateGrievanceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class AssignGrievanceDto {
  @IsUUID()
  @IsNotEmpty()
  assignedToId: string;
}

export class EscalateGrievanceDto {
  @IsUUID()
  @IsOptional()
  reassignToId?: string;
}

export class ResolveGrievanceDto {
  @IsIn(['Resolved', 'Rejected'])
  @IsNotEmpty()
  status: 'Resolved' | 'Rejected';

  @IsString()
  @IsOptional()
  resolutionRemarks?: string;
}
