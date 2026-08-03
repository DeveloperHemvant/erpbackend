import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ANY_PERMISSION_KEY } from "./any-permission.decorator";

@Injectable()
export class AnyPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const permissions: string[] = request.user?.permissions ?? [];

    if (permissions.includes("*") || required.some((p) => permissions.includes(p))) return true;
    throw new ForbiddenException("You do not have permission to perform this action.");
  }
}
