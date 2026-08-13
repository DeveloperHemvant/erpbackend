import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantContextInterceptor } from '../prisma/tenant-context.interceptor';
import type { TenantContext } from '../prisma/tenant-context';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Campus Isolation Phase 3, Milestone 1 — GET /search was reachable by
  // any authenticated user (RequirePermissions() with no args is a
  // structural no-op: [].every(...) is vacuously true). Student/Parent
  // portal accounts already got empty results in practice, only because no
  // portal role happens to hold a matching entity-view permission — an
  // accident, not a control. Made explicit here instead: search is a staff
  // tool, not a family self-service surface, and campusId is never a
  // meaningful concept for a portal identity (D2) — there's nothing correct
  // this route could do with a Student/Parent caller anyway.
  @Get()
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  search(
    @Query('q') q: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    const role = (user.role || '').toLowerCase();
    if (role === 'student' || role === 'parent') {
      throw new ForbiddenException('Search is a staff tool.');
    }
    return this.searchService.search(
      q ?? '',
      user,
      tenantContext,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
