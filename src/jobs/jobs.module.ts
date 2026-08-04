import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FeeGenerationProcessor } from './processors/fee-generation.processor';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'fee-generation',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, FeeGenerationProcessor, PrismaService],
  exports: [JobsService],
})
export class JobsModule {}
