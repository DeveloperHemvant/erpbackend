import { Module } from "@nestjs/common";
import { DisciplineController } from "./discipline.controller";
import { DisciplineService } from "./discipline.service";
import { DisciplineRepository } from "./repositories/discipline.repository";
import { AuthModule } from "../auth/auth.module";
import { CommunicationModule } from "../communication/communication.module";

@Module({
  imports: [AuthModule, CommunicationModule],
  controllers: [DisciplineController],
  providers: [DisciplineService, DisciplineRepository],
  exports: [DisciplineService],
})
export class DisciplineModule {}
