import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import type { TenantContext } from '../prisma/tenant-context';

/**
 * Campus Isolation Phase 3, Milestone 2 — @nestjs/cache-manager's
 * CacheInterceptor uses a fixed, non-parameterized @CacheKey() by default
 * (e.g. 'dashboard_summary'), so every caller — any user, any campus —
 * shares exactly one cache entry per route. Harmless while every route
 * returns the same school-wide answer to everyone; a real cross-campus
 * data leak the moment a route's data starts varying by caller, since the
 * first request after cache expiry "pins" its answer for every other
 * caller until the next expiry. This suffixes the base key with the
 * caller's campus scope so different campuses (and canAccessAllCampuses)
 * get separate cache entries.
 *
 * Requires TenantContextInterceptor to run first in the same
 * @UseInterceptors(...) list so request.tenantContext is already populated
 * when trackBy() reads it (Nest interceptors nest in listed order).
 */
@Injectable()
export class TenantAwareCacheInterceptor extends CacheInterceptor {
  async trackBy(context: ExecutionContext): Promise<string | undefined> {
    // Base signature is (string | undefined | null) possibly wrapped in a
    // Promise — awaiting a plain value resolves immediately, so this works
    // whether the base implementation is sync or async.
    const baseKey = await super.trackBy(context);
    if (!baseKey) return undefined;

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext | undefined;
    const suffix = !tenantContext
      ? 'no-tenant'
      : tenantContext.canAccessAllCampuses
        ? 'all'
        // D3 guarantees campusId is populated whenever
        // canAccessAllCampuses is false; the fallback below is defensive
        // only (a distinct, harmless key suffix, never a crash or a
        // silently-shared cache entry) if that invariant is ever violated.
        : (tenantContext.campusId ?? 'unresolved-campus');

    return `${baseKey}:${suffix}`;
  }
}
