import { Controller, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EsseRunner } from './esse-runner';
import { RequirePermissions } from '../auth/permissions.decorator';

@RequirePermissions('*')
@ApiTags('Simulation Engine')
@Controller('simulation')
export class SimulationController {
  @Post('run')
  @ApiOperation({ summary: 'Run automated school session simulation engine' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of daily cycles to simulate' })
  async runSimulation(@Query('days') days = 1) {
    const runner = new EsseRunner();
    return runner.runSimulation(Number(days));
  }
}
