import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, PrismaService],
})
export class MonitoringModule {}
