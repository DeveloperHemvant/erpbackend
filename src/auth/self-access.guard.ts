import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SELF_ACCESS_PARAM_KEY } from './self-access.decorator';

@Injectable()
export class SelfAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramName = this.reflector.getAllAndOverride<string>(SELF_ACCESS_PARAM_KEY, [context.getHandler(), context.getClass()]);
    if (!paramName) return true;
    const request = context.switchToHttp().getRequest();
    if (request.params?.[paramName] === request.user?.userId) return true;
    throw new ForbiddenException('You can only access your own portal data.');
  }
}
