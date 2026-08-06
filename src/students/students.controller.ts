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

@ApiTags('ERP Core Features')
@Controller('erp-core')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('students')
  @ApiOperation({ summary: 'Admit a new student' })
  createStudent(@Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent(dto);
  }

  @Get('students')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @ApiOperation({ summary: 'List all students' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'sectionId',
    required: false,
    description:
      'Filter to students enrolled in this section (Class/Section 360 roster)',
  })
  getStudents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.studentsService.getStudents(pageNum, limitNum, sectionId);
  }

  @Patch('students/:id')
  @RequirePermissions('MANAGE_USERS')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update student details / status' })
  updateStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateStudent(id, dto);
  }

  @Delete('students/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteStudent(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.deleteStudent(id);
  }

  @Get('students/:id/profile')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get detailed student profile' })
  getStudentProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentProfile(id);
  }

  @Patch('parents/:id/credentials')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update parent email and password' })
  updateParentCredentials(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentCredentialsDto,
  ) {
    return this.studentsService.updateParentCredentials(id, dto);
  }

  @Post('students/:id/setup-parent-portal')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Setup parent portal account' })
  setupParentPortal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetupParentPortalDto,
  ) {
    return this.studentsService.setupParentPortal(id, dto);
  }

  @Get('students/:id/certificates')
  @ApiOperation({ summary: 'Generate certificates for a student' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getCertificates(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getCertificates(id);
  }
}
