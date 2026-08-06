import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReceptionService } from './reception.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import {
  LogCourierDto,
  UpdateCourierStatusDto,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/reception.dto';

// Reuses MANAGE_VISITORS -- the same permission already gates the Visitor &
// Gate Pass desk both Reception and Security use (Phase 1); no new
// permission was introduced for these front-desk-only features.
@RequirePermissions('MANAGE_VISITORS')
@ApiTags('Reception')
@Controller('reception')
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Post('courier')
  @ApiOperation({ summary: 'Log an incoming or outgoing courier item' })
  logCourier(
    @Body() dto: LogCourierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.receptionService.logCourier(user.userId, dto);
  }

  @Get('courier')
  @ApiOperation({ summary: 'List courier logs' })
  getCourierLogs() {
    return this.receptionService.getCourierLogs();
  }

  @Patch('courier/:id')
  @ApiOperation({ summary: 'Update courier item status' })
  updateCourierStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourierStatusDto,
  ) {
    return this.receptionService.updateCourierStatus(id, dto.status);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Schedule a visitor appointment' })
  createAppointment(@Body() dto: CreateAppointmentDto) {
    return this.receptionService.createAppointment(null, dto);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'List scheduled appointments' })
  getAppointments() {
    return this.receptionService.getAppointments();
  }

  @Patch('appointments/:id')
  @ApiOperation({ summary: 'Update an appointment status' })
  updateAppointmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.receptionService.updateAppointmentStatus(id, dto.status);
  }
}
