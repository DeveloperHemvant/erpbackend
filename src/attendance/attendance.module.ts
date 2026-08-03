import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunicationModule } from "../communication/communication.module";
import { AttendanceRepository } from "./repositories/attendance.repository";

@Module({
  imports: [PrismaModule, CommunicationModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
  exports: [AttendanceService],
})
export class AttendanceModule {}
