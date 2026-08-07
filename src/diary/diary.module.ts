import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { DiaryRepository } from './repositories/diary.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DiaryController],
  providers: [DiaryService, DiaryRepository],
  exports: [DiaryService],
})
export class DiaryModule {}
