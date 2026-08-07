import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateMeetingDto, UpdateMeetingStatusDto } from './dto/meetings.dto';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Schedule an internal meeting' })
  createMeeting(
    @Body() dto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.createMeeting(user.userId, dto);
  }

  @Get()
  @RequirePermissions()
  @ApiOperation({ summary: 'List scheduled meetings (visible to any staff so invitees can see their own)' })
  getMeetings() {
    return this.meetingsService.getMeetings();
  }

  @Patch(':id')
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Update a meeting status' })
  updateMeetingStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.meetingsService.updateMeetingStatus(id, dto.status);
  }
}
