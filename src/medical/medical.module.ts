import { Module } from "@nestjs/common";
import { MedicalController } from "./medical.controller";
import { MedicalService } from "./medical.service";
import { MedicalRepository } from "./repositories/medical.repository";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [MedicalController],
  providers: [MedicalService, MedicalRepository],
  exports: [MedicalService],
})
export class MedicalModule {}
