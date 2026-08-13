import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TenantContext } from '../prisma/tenant-context';

/**
 * Campus Isolation Phase 3 — reads request.tenantContext, populated by
 * TenantContextInterceptor (see prisma/tenant-context.interceptor.ts).
 * Synchronous by design: the async work (an academicSession lookup) already
 * happened in the interceptor before this decorator ever runs — a plain
 * createParamDecorator factory has no DI container access, so it cannot
 * build TenantContext itself.
 *
 * Throws loudly instead of returning undefined if the interceptor was
 * forgotten on this route — "silently unscoped" is the exact failure mode
 * this whole initiative exists to close, so a missing wiring must fail the
 * very first request, not degrade to an unfiltered query.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext | undefined;
    if (!tenantContext) {
      throw new InternalServerErrorException(
        'TenantContext was not populated — this route is missing @UseInterceptors(TenantContextInterceptor).',
      );
    }
    return tenantContext;
  },
);
