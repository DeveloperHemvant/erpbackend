import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { tenantContext } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './current-user.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(
    err: unknown,
    user: { identifier?: string } | false,
    info: unknown,
    context: ExecutionContext,
  ) {
    const authenticatedUser = super.handleRequest(err, user, info, context);
    const store = tenantContext.getStore();
    if (store && authenticatedUser && typeof authenticatedUser === 'object') {
      const typedUser = authenticatedUser as AuthenticatedUser;
      store.userEmail = typedUser.identifier ?? 'SYSTEM';
      // Campus Isolation Phase 2 — campusId now comes only from the
      // verified JWT, never a client-supplied header (TenantMiddleware no
      // longer sets it at all). canAccessAllCampuses users get `undefined`
      // here, meaning "no restriction" — the one deliberate exception to
      // "never treat an unset campusId as unrestricted" (D3), encoded in
      // exactly this one place.
      store.campusId = typedUser.canAccessAllCampuses
        ? undefined
        : (typedUser.campusId ?? undefined);
    }
    return authenticatedUser;
  }
}
