import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MedicalService } from './medical.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateMedicalVisitDto } from './dto/medical.dto';

@ApiTags('Health & Medical Room')
@Controller('medical')
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @RequirePermissions('MANAGE_HEALTH')
  @Post('visits')
  @ApiOperation({ summary: 'Record a student medical room visit' })
  @ApiResponse({
    status: 201,
    description: 'Medical visit logged successfully',
  })
  createVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMedicalVisitDto,
  ) {
    return this.medicalService.createVisit(user.userId, dto);
  }

  @RequirePermissions('MANAGE_HEALTH')
  @Get('visits')
  @ApiOperation({ summary: 'Query medical room visits' })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of medical visits retrieved' })
  getVisits(@Query('studentId') studentId?: string) {
    return this.medicalService.getVisits(studentId);
  }
}
