import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { GenerateFeesDto } from './dto/generate-fees.dto';

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
