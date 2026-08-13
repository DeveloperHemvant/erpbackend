import { Module } from '@nestjs/common';
import { SubstitutionController } from './substitution.controller';
import { SubstitutionService } from './substitution.service';
import { SubstitutionRepository } from './repositories/substitution.repository';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunicationModule } from '../communication/communication.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, NotificationsModule, CommunicationModule, PrismaModule],
  controllers: [SubstitutionController],
  providers: [SubstitutionService, SubstitutionRepository],
  exports: [SubstitutionService],
})
export class SubstitutionModule {}
