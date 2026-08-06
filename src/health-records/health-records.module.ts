import { Module } from '@nestjs/common';
import { HealthRecordsController } from './health-records.controller';
import { HealthRecordsService } from './health-records.service';
import { HealthRecordsRepository } from './repositories/health-records.repository';
import { AuthModule } from '../auth/auth.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [AuthModule, CommunicationModule],
  controllers: [HealthRecordsController],
  providers: [HealthRecordsService, HealthRecordsRepository],
  exports: [HealthRecordsService],
})
export class HealthRecordsModule {}
