import { Module } from "@nestjs/common";
import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService]
})
export class PortalModule {}
