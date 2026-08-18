import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateTransitionDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  fromStage: string;

  @IsString()
  @IsNotEmpty()
  toStage: string;
}

export class WorkflowTransitionDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}

export class CreateWorkflowDefinitionDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  stages: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTransitionDto)
  transitions: WorkflowTransitionDto[];
}

// entityType/name together are the @@unique identity (schema.prisma) - not
// editable after creation, so this only covers what a definition actually
// changes over time: its stage list and allowed transitions.
export class UpdateWorkflowDefinitionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  stages?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTransitionDto)
  @IsOptional()
  transitions?: WorkflowTransitionDto[];
}
