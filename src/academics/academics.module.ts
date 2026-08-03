import { Module } from "@nestjs/common";
import { AcademicsController } from "./academics.controller";
import { AcademicsService } from "./academics.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AssignmentRepository } from "./repositories/assignment.repository";

@Module({
  imports: [PrismaModule],
  controllers: [AcademicsController],
  providers: [AcademicsService, AssignmentRepository],
  exports: [AcademicsService],
})
export class AcademicsModule {}
