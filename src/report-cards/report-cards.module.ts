import { Module } from "@nestjs/common";
import { ReportCardsController } from "./report-cards.controller";
import { ReportCardsService } from "./report-cards.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunicationModule } from "../communication/communication.module";
import { ExamsModule } from "../exams/exams.module";
import { ReportCardRepository } from "./repositories/report-card.repository";

@Module({
  imports: [PrismaModule, CommunicationModule, ExamsModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService, ReportCardRepository],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}
