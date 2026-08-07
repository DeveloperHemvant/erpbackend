import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { GenerateFeesDto } from './dto/generate-fees.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// MANAGE_ROLES reuses the same permission audit-log.controller.ts and
// monitoring.controller.ts use (matching web-app's "reqModule: roles"
// grouping) -- deliberately Super Admin/Principal-only. Was undecorated
// (5 routes), therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ROLES')
@ApiTags('Background Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('fee-generation')
  @ApiOperation({ summary: 'Trigger bulk fee generation job' })
  async generateFees(@Body() body: GenerateFeesDto) {
    return this.jobsService.generateBulkInvoices(
      body.classId,
      body.amount,
      body.dueDate,
      body.campusId,
    );
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Check status of a background job' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get list of recent background jobs' })
  async getRecentJobs() {
    return this.jobsService.getRecentJobs();
  }

  @Get('queue-status')
  @ApiOperation({
    summary:
      'Get job queue counts (waiting/active/completed/failed) and error rate',
  })
  async getQueueStatus() {
    return this.jobsService.getQueueStatus();
  }

  @Post(':jobId/retry')
  @ApiOperation({ summary: 'Retry a failed background job' })
  async retryJob(@Param('jobId') jobId: string) {
    return this.jobsService.retryJob(jobId);
  }
}
