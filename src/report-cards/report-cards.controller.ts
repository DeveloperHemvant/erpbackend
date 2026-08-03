// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { ReportCardsService } from "./report-cards.service";
import { CreateReportCardDto, GenerateReportCardDto } from "./dto/report-card.dto";

@ApiTags("ERP Core Features")
@Controller("erp-core")
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post("report-cards")
  @ApiOperation({ summary: "Generate student progress report card" })
  createReportCard(@Body() dto: CreateReportCardDto) {
    return this.reportCardsService.createReportCard(dto);
  }

  @Get("report-cards")
  @ApiOperation({ summary: "List report card history" })
  getReportCards() {
    return this.reportCardsService.getReportCards();
  }

  @Patch("report-cards/:id/approve")
  @ApiOperation({ summary: "Toggle review seal approval" })
  @ApiParam({ name: "id", format: "uuid" })
  updateReportCardApproval(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("isApproved") isApproved: boolean
  ) {
    return this.reportCardsService.updateReportCardApproval(id, isApproved);
  }

  @Delete("report-cards/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteReportCard(@Param("id", ParseUUIDPipe) id: string) {
    return this.reportCardsService.deleteReportCard(id);
  }

  @Post("report-cards/generate")
  @ApiOperation({ summary: "Generate report card from exam marks" })
  generateReportCard(@Body() dto: GenerateReportCardDto) {
    return this.reportCardsService.generateReportCard(dto.enrollmentId, dto.examId);
  }
}
