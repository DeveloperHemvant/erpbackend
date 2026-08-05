import { Module } from "@nestjs/common";
import { SimulatorService } from "./simulator.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [SimulatorService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
