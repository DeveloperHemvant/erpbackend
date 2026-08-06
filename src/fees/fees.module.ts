import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationModule } from '../communication/communication.module';
import { StudentsModule } from '../students/students.module';
import { AuthModule } from '../auth/auth.module';
import { FeeRepository } from './repositories/fee.repository';
import { ErpCoreAuditLogRepository } from './repositories/audit-log.repository';

@Module({
  imports: [PrismaModule, CommunicationModule, StudentsModule, AuthModule],
  controllers: [FeesController],
  providers: [FeesService, FeeRepository, ErpCoreAuditLogRepository],
  exports: [FeesService],
})
export class FeesModule {}
