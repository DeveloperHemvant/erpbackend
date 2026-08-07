import { Module } from '@nestjs/common';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TimetableRepository } from './repositories/timetable.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TimetableController],
  providers: [TimetableService, TimetableRepository],
  exports: [TimetableService],
})
export class TimetableModule {}
