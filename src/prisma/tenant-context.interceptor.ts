import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import { TenantContextBuilder } from './tenant-context';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

/**
 * Campus Isolation Phase 3 — populates request.tenantContext from the
 * authenticated user (request.user, already set by JwtAuthGuard, which runs
 * before interceptors) so @CurrentTenant() has something to read.
 *
 * Deliberately NOT registered globally (see current-tenant.decorator.ts and
 * the Phase 3 plan): applied per-route via @UseInterceptors(...), same
 * visibility as the @RequirePermissions() it sits beside. A global
 * registration would add one extra academicSession query to every
 * authenticated request in the app forever, for a feature only a handful of
 * routes actually consume.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly builder: TenantContextBuilder) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    // Only meaningful for a canAccessAllCampuses user narrowing their own
    // view (TenantContextBuilder.build ignores it otherwise) — see the web
    // campus switcher, which sends this on every API request once a campus
    // is selected.
    const requestedCampusId = request.headers?.['x-campus-id'] as
      | string
      | undefined;

    return from(this.builder.build(user, requestedCampusId)).pipe(
      switchMap((tenantContext) => {
        request.tenantContext = tenantContext;
        return next.handle();
      }),
    );
  }
}
