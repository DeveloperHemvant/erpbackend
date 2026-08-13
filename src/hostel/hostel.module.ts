import { Module } from '@nestjs/common';
import { HostelController } from './hostel.controller';
import { HostelService } from './hostel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [PrismaModule, AuthModule, AttachmentsModule],
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService],
})
export class HostelModule {}
