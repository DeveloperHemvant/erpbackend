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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateParentCredentialsDto,
  SetupParentPortalDto,
} from './dto/student.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantContextInterceptor } from '../prisma/tenant-context.interceptor';
import type { TenantContext } from '../prisma/tenant-context';

@ApiTags('ERP Core Features')
@Controller('erp-core')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('students')
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Admit a new student' })
  createStudent(@Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent(dto);
  }

  @Get('students')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  @ApiOperation({ summary: 'List all students' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'sectionId',
    required: false,
    description:
      'Filter to students enrolled in this section (Class/Section 360 roster)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter by full name or admission number (case-insensitive)',
  })
  getStudents(
    @CurrentTenant() tenantContext: TenantContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sectionId') sectionId?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.studentsService.getStudents(
      tenantContext,
      pageNum,
      limitNum,
      sectionId,
      search,
    );
  }

  @Patch('students/:id')
  @RequirePermissions('MANAGE_USERS')
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update student details / status' })
  updateStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.studentsService.updateStudent(id, dto, tenantContext);
  }

  @Delete('students/:id')
  @RequirePermissions('MANAGE_USERS')
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.studentsService.deleteStudent(id, tenantContext);
  }

  @Get('students/:id/profile')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get detailed student profile' })
  getStudentProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.studentsService.getStudentProfile(id, tenantContext);
  }

  @Get('students/:id/attendance-summary')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary:
      "Admin-scoped attendance count-by-status summary for one student (Student 360's Attendance tab)",
  })
  getStudentAttendanceSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.studentsService.getAttendanceSummary(id, tenantContext);
  }

  @Get('students/:id/fees')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @UseInterceptors(TenantContextInterceptor)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary:
      "Admin-scoped fee invoices/payments summary for one student (Student 360's Fees tab)",
  })
  getStudentFees(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantContext: TenantContext,
  ) {
    return this.studentsService.getFees(id, tenantContext);
  }

  @Patch('parents/:id/credentials')
  @RequirePermissions('MANAGE_USERS')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update parent email and password' })
  updateParentCredentials(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentCredentialsDto,
  ) {
    return this.studentsService.updateParentCredentials(id, dto);
  }

  @Post('students/:id/setup-parent-portal')
  @RequirePermissions('MANAGE_USERS')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Setup parent portal account' })
  setupParentPortal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetupParentPortalDto,
  ) {
    return this.studentsService.setupParentPortal(id, dto);
  }

  @Get('students/:id/certificates')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @ApiOperation({ summary: 'Generate certificates for a student' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getCertificates(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getCertificates(id);
  }
}
