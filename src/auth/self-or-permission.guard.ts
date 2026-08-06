import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SELF_OR_PERMISSION_KEY,
  SelfOrPermissionConfig,
} from './self-or-permission.decorator';

@Injectable()
export class SelfOrPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.getAllAndOverride<SelfOrPermissionConfig>(
      SELF_OR_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const paramValue = request.params?.[config.paramName];
    const user = request.user;

    if (paramValue && user?.userId === paramValue) return true;

    const permissions: string[] = user?.permissions ?? [];
    if (
      permissions.includes('*') ||
      config.permissions.some((p) => permissions.includes(p))
    )
      return true;

    throw new ForbiddenException('You do not have access to this resource.');
  }
}
