import { IsObject } from 'class-validator';

export class EvaluateRuleDto {
  @IsObject()
  context: Record<string, unknown>;
}
