import { IsString, IsNotEmpty } from 'class-validator';

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
