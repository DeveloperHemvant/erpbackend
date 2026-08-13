import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ReportCardsService } from './report-cards.service';
import {
  CreateReportCardDto,
  GenerateReportCardDto,
} from './dto/report-card.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// Class-level MANAGE_EXAMS default (report cards are generated from exam
// marks; matches exams.controller.ts/ems.controller.ts's permission tier).
// Was undecorated (5 routes), therefore blocked for every non-'*' role.
@RequirePermissions('MANAGE_EXAMS')
@ApiTags('ERP Core Features')
@Controller('erp-core')
export class ReportCardsController {
  constructor(
    private readonly reportCardsService: ReportCardsService,
    private readonly ownershipService: OwnershipService,
  ) {}

  @Post('report-cards')
  @ApiOperation({ summary: 'Generate student progress report card' })
  createReportCard(@Body() dto: CreateReportCardDto) {
    return this.reportCardsService.createReportCard(dto);
  }

  @Get('report-cards')
  @ApiOperation({ summary: 'List report card history' })
  getReportCards() {
    return this.reportCardsService.getReportCards();
  }

  @Patch('report-cards/:id/approve')
  @ApiOperation({ summary: 'Toggle review seal approval and save remarks' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateReportCardApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isApproved') isApproved: boolean,
    @Body('remarks') remarks?: string,
  ) {
    return this.reportCardsService.updateReportCardApproval(
      id,
      isApproved,
      remarks,
    );
  }

  @Delete('report-cards/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteReportCard(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportCardsService.deleteReportCard(id);
  }

  @Post('report-cards/generate')
  @ApiOperation({ summary: 'Generate report card from exam marks' })
  generateReportCard(@Body() dto: GenerateReportCardDto) {
    return this.reportCardsService.generateReportCard(
      dto.enrollmentId,
      dto.examId,
    );
  }

  // Own-record download — a student/parent never holds MANAGE_EXAMS, so this
  // route checks staff-permission OR family-ownership inline (same pattern
  // as HostelController.giveOutpassConsent) instead of relying on the
  // class-level default.
  @Get('report-cards/:id/pdf')
  @RequirePermissions()
  @ApiOperation({ summary: 'Render (or re-render) this report card as a real PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async downloadReportCardPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isStaff =
      user.permissions.includes('*') || user.permissions.includes('MANAGE_EXAMS');
    if (!isStaff) {
      const role = (user.role || '').toLowerCase();
      if (role !== 'student' && role !== 'parent') {
        throw new ForbiddenException('You do not have access to this report card.');
      }
      await this.ownershipService.assertOwnsReportCard(user, id);
    }
    return this.reportCardsService.renderReportCardPdf(id);
  }
}
