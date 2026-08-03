import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('fee-generation') private feeQueue: Queue,
    private prisma: PrismaService
  ) {}

  async generateBulkInvoices(classId: string, amount: string, dueDate: string, campusId: string) {
    if (!classId || !amount || !dueDate || !campusId) {
      throw new BadRequestException('classId, amount, dueDate, and campusId are required');
    }

    // Verify class exists
    const classRecord = await this.prisma.class.findUnique({ where: { id: classId }});
    if (!classRecord) throw new BadRequestException('Class not found');

    // Add job to the queue
    const job = await this.feeQueue.add('generate-invoices', {
      classId,
      amount,
      dueDate,
      campusId,
    });

    return {
      message: 'Bulk invoice generation started',
      jobId: job.id,
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.feeQueue.getJob(jobId);
    if (!job) {
      return { status: 'not-found' };
    }

    const state = await job.getState();
    const progress = job.progress;
    
    let result: any = null;
    if (state === 'completed') {
      result = job.returnvalue;
    } else if (state === 'failed') {
      result = job.failedReason;
    }

    return {
      id: job.id,
      name: job.name,
      status: state,
      progress,
      result,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }
  
  async getRecentJobs() {
    // Get last 10 jobs across all states
    const active = await this.feeQueue.getJobs(['active', 'waiting', 'completed', 'failed'], 0, 10, true);
    return active.map(job => ({
      id: job.id,
      name: job.name,
      progress: job.progress,
      timestamp: job.timestamp
    }));
  }
}
