import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireSelfOrPermission } from '../auth/self-or-permission.decorator';
import { SelfOrPermissionGuard } from '../auth/self-or-permission.guard';

@ApiTags('Staff Onboarding')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Onboard new staff member' })
  @ApiResponse({ status: 201, description: 'Staff onboarded successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists in roster' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'List all registered staff members' })
  @ApiResponse({
    status: 200,
    description: 'Staff roster retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.staffService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('id', 'MANAGE_USERS')
  @RequirePermissions()
  @ApiOperation({
    summary:
      "Get staff profile by UUID — the staff member's own record, or any record for admins",
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Staff profile details found' })
  @ApiResponse({ status: 404, description: 'Staff record not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff details / roles link' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Staff updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff record not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Post(':id/assignments')
  @ApiOperation({ summary: 'Update Teacher Assignments' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Teacher assignments updated' })
  updateTeacherAssignments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignments') assignments: any[],
  ) {
    return this.staffService.updateTeacherAssignments(id, assignments);
  }

  @Post(':id/transport-assignments')
  @ApiOperation({ summary: 'Update Transport Assignments' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Transport assignments updated' })
  updateTransportAssignments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignments') assignments: any[],
  ) {
    return this.staffService.updateTransportAssignments(id, assignments);
  }

  @Post('self-attendance')
  @RequirePermissions()
  @ApiOperation({ summary: 'Mark self attendance for logged in staff' })
  markSelfAttendance(
    @Body() data: { staffId: string; status: string; date: string },
  ) {
    return this.staffService.markSelfAttendance(data);
  }

  @Get('self-attendance/:staffId')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Check if logged in staff has already marked attendance today',
  })
  getSelfAttendance(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Query('date') date?: string,
  ) {
    return this.staffService.getSelfAttendance(staffId, date);
  }

  @Get(':id/attendance-logs')
  @ApiOperation({ summary: 'Get staff attendance logs' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filter by month YYYY-MM',
  })
  getAttendanceLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('month') month?: string,
  ) {
    return this.staffService.getAttendanceLogs(id, month);
  }

  @Post(':id/leaves')
  @ApiOperation({ summary: 'Apply for a leave' })
  applyLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
    },
  ) {
    return this.staffService.applyLeave(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete staff member by UUID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Staff deleted successfully' })
  @ApiResponse({ status: 404, description: 'Staff record not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.remove(id);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file (photo/document) for staff' })
  @ApiParam({ name: 'id', format: 'uuid' })
  uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: any,
  ) {
    // Return a mock URL for now. In a real app, this would be uploaded to S3 or a local public folder.
    const mockUrl = `/uploads/staff/${id}/${file.originalname}`;
    return { url: mockUrl };
  }
}
