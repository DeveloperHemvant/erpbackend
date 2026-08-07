import { SetMetadata } from '@nestjs/common';

export const SELF_ACCESS_PARAM_KEY = 'selfAccessParam';
export const RequireSelfAccess = (paramName: string) =>
  SetMetadata(SELF_ACCESS_PARAM_KEY, paramName);
