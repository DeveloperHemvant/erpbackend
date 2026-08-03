import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('System Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('system-metrics')
  @ApiOperation({ summary: 'Get live system performance and health metrics' })
  async getSystemMetrics() {
    return this.monitoringService.getSystemMetrics();
  }
}
