import { Controller, Post, Get, Body, Param, ParseUUIDPipe, Query, Put } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PortalService } from "./portal.service";
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { RequireSelfAccess } from '../auth/self-access.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PortalLoginDto } from './dto/portal-login.dto';

@ApiTags("Portal")
@Controller("portal")
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post("auth/login")
  @ApiOperation({ summary: "Portal User Login" })
  async login(@Body() dto: PortalLoginDto) {
    return this.authService.login({ identifier: dto.username, password: dto.password });
  }

  // Passing referenceId directly as query or param for this MVP
  @Get("student/:id/dashboard")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_OWN_PROFILE')
  @ApiOperation({ summary: "Get Student Dashboard Data" })
  async getStudentDashboard(@Param("id", ParseUUIDPipe) id: string) {
    return this.portalService.getStudentDashboard(id);
  }

  @Get("parent/:id/dashboard")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_CHILD_PROFILE')
  @ApiOperation({ summary: "Get Parent Dashboard Data" })
  async getParentDashboard(@Param("id", ParseUUIDPipe) id: string) {
    return this.portalService.getParentDashboard(id);
  }

  @Get("staff/:id/dashboard")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_OWN_SCHEDULE')
  @ApiOperation({ summary: "Get dynamic widget data for staff dashboard" })
  async getStaffDashboard(@Param("id", ParseUUIDPipe) id: string) {
    return this.portalService.getStaffDashboard(id);
  }

  @Get("student/:id/attendance-logs")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_OWN_PROFILE')
  @ApiOperation({ summary: "Get student attendance logs for the past 30 days" })
  getStudentAttendanceLogs(@Param("id", ParseUUIDPipe) id: string) {
    return this.portalService.getStudentAttendanceLogs(id);
  }

  @Post("student/:id/leaves")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_OWN_PROFILE')
  @ApiOperation({ summary: "Apply for a leave for a student" })
  applyStudentLeave(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: { leaveType: string, startDate: string, endDate: string, reason?: string }
  ) {
    return this.portalService.applyStudentLeave(id, data);
  }

  @Get("staff/:id/class-desk")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_STUDENTS')
  @ApiOperation({ summary: "Get class teacher desk data (students, attendance, leaves)" })
  getClassTeacherDesk(@Param("id", ParseUUIDPipe) id: string, @Query("sectionId", ParseUUIDPipe) sectionId: string) {
    return this.portalService.getClassTeacherDesk(id, sectionId);
  }

  @Post("staff/:id/class-attendance")
  @RequireSelfAccess('id')
  @RequirePermissions('MARK_ATTENDANCE')
  @ApiOperation({ summary: "Submit bulk attendance for a class" })
  submitClassAttendance(
    @Param("id", ParseUUIDPipe) id: string, 
    @Body() data: { sectionId: string, date: string, attendance: { enrollmentId: string, status: string }[] }
  ) {
    return this.portalService.submitClassAttendance(id, data);
  }

  @Get("staff/:id/class-attendance-history")
  @RequireSelfAccess('id')
  @RequirePermissions('VIEW_STUDENTS')
  @ApiOperation({ summary: "Get dynamic attendance history for a class section" })
  getClassAttendanceHistory(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("sectionId", ParseUUIDPipe) sectionId: string
  ) {
    return this.portalService.getClassAttendanceHistory(id, sectionId);
  }

  @Put("staff/:id/student-leave/:leaveId")
  @RequireSelfAccess('id')
  @RequirePermissions('MARK_ATTENDANCE')
  @ApiOperation({ summary: "Resolve a student leave request" })
  resolveStudentLeave(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("leaveId", ParseUUIDPipe) leaveId: string,
    @Body() data: { status: string, remarks?: string }
  ) {
    return this.portalService.resolveStudentLeave(id, leaveId, data);
  }
}
