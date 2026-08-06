import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentRepository } from './repositories/student.repository';

@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentRepository],
  exports: [StudentsService, StudentRepository],
})
export class StudentsModule {}
