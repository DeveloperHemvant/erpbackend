import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GrievanceService } from './grievance.service';
import {
  CreateGrievanceDto,
  AssignGrievanceDto,
  EscalateGrievanceDto,
  ResolveGrievanceDto,
} from './dto/grievance.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Grievances')
@Controller('grievances')
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Post()
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Raise a grievance/concern — open to every authenticated role, always filed as the caller',
  })
  createGrievance(
    @Body() dto: CreateGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievanceService.createGrievance(dto, user);
  }

  @Get('mine')
  @RequirePermissions()
  @ApiOperation({ summary: 'Grievances the calling user has filed' })
  getMyGrievances(@CurrentUser() user: AuthenticatedUser) {
    return this.grievanceService.getMyGrievances(user);
  }

  @Get('assigned-to-me')
  @RequirePermissions()
  @ApiOperation({ summary: "Grievances currently assigned to the caller's queue" })
  getAssignedToMe(@CurrentUser() user: AuthenticatedUser) {
    return this.grievanceService.getAssignedToMe(user);
  }

  @Get()
  @RequirePermissions('MANAGE_GRIEVANCES')
  @ApiOperation({ summary: 'List every grievance (triage/oversight queue)' })
  getAllGrievances() {
    return this.grievanceService.getAllGrievances();
  }

  @Get(':id')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Get one grievance — reporter, assignee, or MANAGE_GRIEVANCES only',
  })
  getGrievance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievanceService.getGrievance(id, user);
  }

  @Patch(':id/assign')
  @RequirePermissions('MANAGE_GRIEVANCES')
  @ApiOperation({ summary: 'Assign or reassign a grievance to a staff member' })
  assignGrievance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignGrievanceDto,
  ) {
    return this.grievanceService.assignGrievance(id, dto.assignedToId);
  }

  @Patch(':id/escalate')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Escalate a grievance to the next level, optionally reassigning it — assignee or MANAGE_GRIEVANCES only',
  })
  escalateGrievance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievanceService.escalateGrievance(id, dto, user);
  }

  @Patch(':id/resolve')
  @RequirePermissions()
  @ApiOperation({
    summary:
      'Resolve or reject a grievance with remarks — assignee or MANAGE_GRIEVANCES only',
  })
  resolveGrievance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievanceService.resolveGrievance(id, dto, user);
  }
}
