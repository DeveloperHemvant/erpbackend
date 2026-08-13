import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireStudentAccessOrPermission } from '../auth/student-access-or-permission.decorator';
import { StudentAccessOrPermissionGuard } from '../auth/student-access-or-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import {
  CreateDisciplineIncidentDto,
  UpdateDisciplineIncidentDto,
  AddCounselingNoteDto,
} from './dto/discipline.dto';

@RequirePermissions('MANAGE_DISCIPLINE')
@Controller('discipline')
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @Post('students/:studentId/incidents')
  createIncident(
    @Param('studentId') studentId: string,
    @Body() dto: CreateDisciplineIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disciplineService.createIncident(studentId, user.userId, dto);
  }

  // Staff see full detail including confidential counseling notes; a parent
  // or the student themself sees the same route but a note-free summary.
  @Get('students/:studentId/incidents')
  @UseGuards(StudentAccessOrPermissionGuard)
  @RequireStudentAccessOrPermission('studentId', ['MANAGE_DISCIPLINE'])
  @RequirePermissions()
  getIncidentsForStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isStaff =
      user.permissions.includes('*') ||
      user.permissions.includes('MANAGE_DISCIPLINE');
    return isStaff
      ? this.disciplineService.getIncidentsForStudentFull(studentId)
      : this.disciplineService.getIncidentsForStudentBasic(studentId);
  }

  @Get('incidents')
  getAllIncidents() {
    return this.disciplineService.getAllIncidents();
  }

  @Patch('incidents/:id')
  updateIncident(
    @Param('id') id: string,
    @Body() dto: UpdateDisciplineIncidentDto,
  ) {
    return this.disciplineService.updateIncident(id, dto);
  }

  @Post('incidents/:id/notes')
  addCounselingNote(
    @Param('id') id: string,
    @Body() dto: AddCounselingNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disciplineService.addCounselingNote(id, user.userId, dto);
  }
}
