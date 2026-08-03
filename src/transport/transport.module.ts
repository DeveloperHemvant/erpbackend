import { Module } from "@nestjs/common";
import { TransportController } from "./transport.controller";
import { TransportService } from "./transport.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunicationModule } from "../communication/communication.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, CommunicationModule, NotificationsModule],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService]
})
export class TransportModule {}
