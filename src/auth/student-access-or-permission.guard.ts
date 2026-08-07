import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  STUDENT_ACCESS_OR_PERMISSION_KEY,
  StudentAccessOrPermissionConfig,
} from './student-access-or-permission.decorator';
import { OwnershipService } from './ownership.service';

@Injectable()
export class StudentAccessOrPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownershipService: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config =
      this.reflector.getAllAndOverride<StudentAccessOrPermissionConfig>(
        STUDENT_ACCESS_OR_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permissions: string[] = user?.permissions ?? [];

    if (
      permissions.includes('*') ||
      config.permissions.some((p) => permissions.includes(p))
    )
      return true;

    // OwnershipService.assertOwnsStudent silently passes through any role that
    // isn't literally "student"/"parent" — correct for EMS's staff-only routes
    // (already gated by a class-level permission before that check ever runs),
    // but wrong here: this guard's whole point is staff WITHOUT the permission
    // must be rejected, not waved through. Only defer to ownership for an
    // actual portal (student/parent) identity.
    const role = (user?.role || '').toLowerCase();
    if (role !== 'student' && role !== 'parent') {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const studentId = request.params?.[config.paramName];
    await this.ownershipService.assertOwnsStudent(user, studentId);
    return true;
  }
}
