import { Module } from "@nestjs/common";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ExamRepository } from "./repositories/exam.repository";

@Module({
  imports: [PrismaModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamRepository],
  exports: [ExamsService, ExamRepository],
})
export class ExamsModule {}
