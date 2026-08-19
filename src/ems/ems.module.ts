import { Module } from '@nestjs/common';
import { EmsController } from './ems.controller';
import { EmsService } from './ems.service';
import { EmsRepository } from './repositories/ems.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunicationModule } from '../communication/communication.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    CommunicationModule,
    AuthModule,
    DocumentsModule,
  ],
  controllers: [EmsController],
  providers: [EmsService, EmsRepository],
  exports: [EmsService, EmsRepository],
})
export class EmsModule {}
