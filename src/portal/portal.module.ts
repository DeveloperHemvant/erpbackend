import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DiaryModule } from '../diary/diary.module';
import { LmsModule } from '../lms/lms.module';

@Module({
  imports: [PrismaModule, AuthModule, DiaryModule, LmsModule],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
