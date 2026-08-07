import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, PrismaService],
})
export class MonitoringModule {}
