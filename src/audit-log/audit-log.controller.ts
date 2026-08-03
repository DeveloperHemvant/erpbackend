import { Controller, Get } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getLogs() {
    const data = await this.auditLogService.getLogs();
    return { data };
  }
}
