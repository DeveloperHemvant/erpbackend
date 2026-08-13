import { Module } from '@nestjs/common';
import { GrievanceController } from './grievance.controller';
import { GrievanceService } from './grievance.service';
import { GrievanceRepository } from './repositories/grievance.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PrismaModule, CommunicationModule],
  controllers: [GrievanceController],
  providers: [GrievanceService, GrievanceRepository],
  exports: [GrievanceService],
})
export class GrievanceModule {}
