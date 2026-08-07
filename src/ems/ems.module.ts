import { Module } from '@nestjs/common';
import { EmsController } from './ems.controller';
import { EmsService } from './ems.service';
import { EmsRepository } from './repositories/ems.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule],
  controllers: [EmsController],
  providers: [EmsService, EmsRepository],
  exports: [EmsService, EmsRepository],
})
export class EmsModule {}
