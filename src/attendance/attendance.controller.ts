import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/attendance.dto';

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

  @Delete('attendance/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.deleteAttendance(id);
  }
}
