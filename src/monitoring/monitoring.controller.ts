import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { RequirePermissions } from '../auth/permissions.decorator';

// MANAGE_ROLES -- see jobs.controller.ts's comment for the shared rationale.
// Was undecorated (2 routes), therefore blocked for every non-'*' role.
@RequirePermissions('MANAGE_ROLES')
@ApiTags('System Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('system-metrics')
  @ApiOperation({ summary: 'Get live system performance and health metrics' })
  async getSystemMetrics() {
    return this.monitoringService.getSystemMetrics();
  }

  @Get('queue-status')
  @ApiOperation({ summary: 'Get background job queue counts and error rate' })
  async getQueueStatus() {
    return this.monitoringService.getQueueStatus();
  }
}
