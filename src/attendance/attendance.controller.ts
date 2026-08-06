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
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MARK_ATTENDANCE default -- see hostel.controller.ts's comment
// for the full explanation of why an undecorated route is blocked, not open,
// under this app's global PermissionsGuard. This controller had zero
// decorators across all 6 routes before this fix.
@RequirePermissions('MARK_ATTENDANCE')
@ApiTags('ERP Core Features')
@Controller('erp-core')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance')
  @ApiOperation({ summary: 'Log attendance record (Student/Staff)' })
  logAttendance(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.logAttendance(dto);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'List attendance records' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by exact date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter by month (YYYY-MM)',
  })
  getAttendance(@Query('date') date?: string, @Query('month') month?: string) {
    return this.attendanceService.getAttendance(date, month);
  }

  @Get('attendance/summary')
  @ApiOperation({
    summary:
      'Attendance count-by-status summary for one class section (Class/Section 360)',
  })
  @ApiQuery({ name: 'sectionId', required: true })
  getAttendanceSummary(@Query('sectionId') sectionId: string) {
    return this.attendanceService.getAttendanceSummary(sectionId);
  }

  @Post('attendance/biometric-webhook')
  @ApiOperation({
    summary: 'Accepts hardware camera payload to mark attendance automatically',
  })
  handleBiometricWebhook(@Body() _payload: any) {
    // Expected Payload: { studentId?: string, staffId?: string, confidence: number, timestamp: string }
    // If we had a real ML model deployed remotely, it would ping this endpoint.
    // We just return success to simulate the webhook acceptance.
    return {
      status: 'accepted',
      message: 'Biometric record queued for processing',
    };
  }

  @Patch('attendance/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Correct/update an existing attendance record status' })
  updateAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(id, dto);
  }

  @Delete('attendance/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.deleteAttendance(id);
  }
}
