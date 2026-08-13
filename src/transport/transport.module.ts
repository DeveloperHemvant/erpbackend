import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportRepository } from './repositories/transport.repository';
import { TransportOwnershipService } from './transport-ownership.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationModule } from '../communication/communication.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    CommunicationModule,
    NotificationsModule,
    DocumentsModule,
    AuthModule,
  ],
  controllers: [TransportController],
  providers: [TransportService, TransportRepository, TransportOwnershipService],
  exports: [TransportService, TransportOwnershipService],
})
export class TransportModule {}
