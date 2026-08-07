import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import {
  CreateTimetableDto,
  CreateTimetablePeriodDto,
} from './dto/timetable.dto';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MANAGE_ACADEMICS default (matches web-app's "reqModule:
// masterdata" grouping for Timetable Desk). Was undecorated (12 routes),
// therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ACADEMICS')
@ApiTags('ERP Core Features')
@Controller('erp-core')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('substitutes')
  @ApiOperation({
    summary: 'Suggest available substitute teachers for a period',
  })
  getSubstituteSuggestions(
    @Query('dayOfWeek') dayOfWeek: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('subjectId', ParseUUIDPipe) subjectId: string,
  ) {
    return this.timetableService.getSubstituteSuggestions(
      dayOfWeek,
      startTime,
      endTime,
      subjectId,
    );
  }

  @Post('timetable-slots')
  @ApiOperation({ summary: 'Create a new timetable slot type' })
  createTimetableSlot(@Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.createTimetableSlot(dto);
  }

  @Post('timetable-slots/seed')
  @ApiOperation({ summary: 'Seed default timetable slots for a session' })
  seedTimetableSlots(@Body('sessionId') sessionId: string) {
    return this.timetableService.seedTimetableSlots(sessionId);
  }

  @Get('timetable-slots')
  @ApiOperation({ summary: 'List all timetable slot types' })
  getTimetableSlots() {
    return this.timetableService.getTimetableSlots();
  }

  @Delete('timetable-slots/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteTimetableSlot(@Param('id', ParseUUIDPipe) id: string) {
    return this.timetableService.deleteTimetableSlot(id);
  }

  @Post('timetables')
  @ApiOperation({ summary: 'Create a new timetable (e.g. Summer Session)' })
  createTimetable(@Body() dto: CreateTimetableDto) {
    return this.timetableService.createTimetable(dto);
  }

  @Get('timetables')
  @ApiOperation({ summary: 'List all timetables' })
  getTimetables() {
    return this.timetableService.getTimetables();
  }

  @Patch('timetables/:id/activate')
  @ApiOperation({ summary: 'Set timetable status to Active' })
  @ApiParam({ name: 'id', format: 'uuid' })
  activateTimetable(@Param('id', ParseUUIDPipe) id: string) {
    return this.timetableService.activateTimetable(id);
  }

  @Post('timetables/:id/auto-generate')
  @ApiOperation({ summary: 'Auto-generate the timetable periods' })
  @ApiParam({ name: 'id', format: 'uuid' })
  autoGenerateTimetable(@Param('id', ParseUUIDPipe) id: string) {
    return this.timetableService.autoGenerateTimetable(id);
  }

  @Post('timetable-periods')
  @ApiOperation({ summary: 'Schedule a class period within a timetable' })
  createTimetablePeriod(@Body() dto: CreateTimetablePeriodDto) {
    return this.timetableService.createTimetablePeriod(dto);
  }

  @Get('timetable-periods')
  @ApiOperation({ summary: 'List timetable periods' })
  getTimetablePeriods() {
    return this.timetableService.getTimetablePeriods();
  }

  @Delete('timetable-periods/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteTimetablePeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.timetableService.deleteTimetablePeriod(id);
  }
}
