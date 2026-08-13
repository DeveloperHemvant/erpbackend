import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireStudentAccessOrPermission } from '../auth/student-access-or-permission.decorator';
import { StudentAccessOrPermissionGuard } from '../auth/student-access-or-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import {
  CreateAssemblyDto,
  CreateSchoolHouseDto,
  UpdateSchoolHouseDto,
  AwardHousePointsDto,
  CreateStudentAchievementDto,
  CreateStaffDutyDto,
} from './dto/activities.dto';

@ApiTags('Co-Curricular & Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Post('assembly')
  @ApiOperation({ summary: 'Log a morning assembly' })
  @ApiResponse({ status: 201, description: 'Assembly logged successfully' })
  createAssembly(@Body() dto: CreateAssemblyDto) {
    return this.activitiesService.createAssembly(dto);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Get('assembly')
  @ApiOperation({ summary: 'Get morning assemblies log' })
  @ApiQuery({ name: 'campusId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of assemblies' })
  getAllAssemblies(@Query('campusId') campusId?: string) {
    return this.activitiesService.getAllAssemblies(campusId);
  }

  // School events/competitions live in the ACMS module now (POST/GET /acms/events,
  // PUT/DELETE /acms/events/:id) — this used to duplicate that as a separate
  // SchoolEvent model; consolidated so there's one event system feeding the
  // unified calendar instead of two out-of-sync ones...

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Post('houses')
  @ApiOperation({ summary: 'Create a school house' })
  @ApiResponse({ status: 201, description: 'House created successfully' })
  createHouse(@Body() dto: CreateSchoolHouseDto) {
    return this.activitiesService.createHouse(dto);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Put('houses/:houseId')
  @ApiOperation({
    summary:
      'Update a school house (name, captain, vice-captain, teacher-in-charge)',
  })
  @ApiParam({ name: 'houseId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'House updated successfully' })
  updateHouse(
    @Param('houseId') houseId: string,
    @Body() dto: UpdateSchoolHouseDto,
  ) {
    return this.activitiesService.updateHouse(houseId, dto);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Get('houses/:houseId/members')
  @ApiOperation({ summary: 'List students belonging to a house' })
  @ApiParam({ name: 'houseId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of house members' })
  getHouseMembers(@Param('houseId') houseId: string) {
    return this.activitiesService.getHouseMembers(houseId);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Post('houses/:houseId/points')
  @ApiOperation({ summary: 'Award points to a school house' })
  @ApiParam({ name: 'houseId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'House points updated' })
  awardHousePoints(
    @Param('houseId') houseId: string,
    @Body() dto: AwardHousePointsDto,
  ) {
    return this.activitiesService.awardHousePoints(houseId, dto.points);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Get('houses/standings')
  @ApiOperation({ summary: 'Get school houses leaderboards' })
  @ApiResponse({ status: 200, description: 'House standings listing' })
  getHouseStandings() {
    return this.activitiesService.getHouseStandings();
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Post('achievements')
  @ApiOperation({ summary: 'Record a student co-curricular achievement award' })
  @ApiResponse({ status: 201, description: 'Achievement logged successfully' })
  createAchievement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentAchievementDto,
  ) {
    return this.activitiesService.createAchievement(user.userId, dto);
  }

  // Staff with MANAGE_ACTIVITIES see any student's achievements; a parent or
  // the student themself can see their own — same self-or-permission pattern
  // as discipline/health-records, so this is viewable from the student's own
  // dashboard, not just the admin desk.
  @UseGuards(StudentAccessOrPermissionGuard)
  @RequireStudentAccessOrPermission('studentId', ['MANAGE_ACTIVITIES'])
  @RequirePermissions()
  @Get('students/:studentId/achievements')
  @ApiOperation({ summary: 'Get achievements for a student' })
  @ApiParam({ name: 'studentId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of achievements' })
  getStudentAchievements(@Param('studentId') studentId: string) {
    return this.activitiesService.getStudentAchievements(studentId);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Post('duties')
  @ApiOperation({ summary: 'Allocate staff member to supervisory duty slot' })
  @ApiResponse({ status: 201, description: 'Duty allocation recorded' })
  createStaffDuty(@Body() dto: CreateStaffDutyDto) {
    return this.activitiesService.createStaffDuty(dto);
  }

  @RequirePermissions('MANAGE_ACTIVITIES')
  @Get('duties')
  @ApiOperation({ summary: 'Get duty allocation logs' })
  @ApiQuery({ name: 'staffId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of duties' })
  getStaffDuties(@Query('staffId') staffId?: string) {
    return this.activitiesService.getStaffDuties(staffId);
  }
}
