import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { RequirePermissions } from '../auth/permissions.decorator';

// MANAGE_ROLES reuses the same permission roles.controller.ts already gates
// itself with (matching web-app's own "reqModule: roles" grouping for Audit
// Logs/Monitoring/Background Tasks) -- deliberately Super Admin/Principal-only
// today since no seeded role holds MANAGE_ROLES yet. This controller had zero
// decorators before this fix, so it was previously blocked for everyone.
@RequirePermissions('MANAGE_ROLES')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getLogs(
    @Query('search') search?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.auditLogService.getLogs({
      search,
      module,
      action,
      performedBy,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      entityType,
      entityId,
    });
  }
}
