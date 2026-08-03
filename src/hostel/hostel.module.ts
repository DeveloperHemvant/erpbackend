import { Module } from "@nestjs/common";
import { HostelController } from "./hostel.controller";
import { HostelService } from "./hostel.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService]
})
export class HostelModule {}
