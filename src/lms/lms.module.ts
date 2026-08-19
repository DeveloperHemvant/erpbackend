import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PrismaModule, CommunicationModule],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
