// @ts-nocheck
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('fee-generation')
export class FeeGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(FeeGenerationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    const { classId, amount, dueDate, campusId } = job.data;
    
    let processedCount = 0;
    
    try {
      // Find all enrollments for this class
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          section: { classId: classId },
          status: 'Enrolled'
        }
      });

      const total = enrollments.length;
      if (total === 0) {
        return { processedCount: 0, message: 'No students found for this class' };
      }

      // Process invoices iteratively to update progress
      for (let i = 0; i < total; i++) {
        const enrollment = enrollments[i];
        
        await this.prisma.feeInvoice.create({
          data: {
            studentId: student.id,
            amount,
            totalAmount: amount,
            dueDate,
            status: 'Unpaid',
            campusId
          }
        });

        processedCount++;
        
        // Update progress every 5 invoices or if it's the last one
        if (i % 5 === 0 || i === total - 1) {
          await job.updateProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      this.logger.log(`Completed job ${job.id}. Generated ${processedCount} invoices.`);
      return { processedCount, status: 'success' };
    } catch (error) {
      this.logger.error(`Failed job ${job.id}: ${error.message}`, error.stack);
      throw error; // Let BullMQ handle the retry/failure state
    }
  }
}
