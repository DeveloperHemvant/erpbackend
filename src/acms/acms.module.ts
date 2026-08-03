import { Module } from "@nestjs/common";
import { AcmsService } from "./acms.service";
import { AcmsController } from "./acms.controller";

@Module({
  controllers: [AcmsController],
  providers: [AcmsService],
  exports: [AcmsService],
})
export class AcmsModule {}
