import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ActivitiesService } from "./activities.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import {
  CreateAssemblyDto,
  CreateSchoolEventDto,
  AwardHousePointsDto,
  CreateStudentAchievementDto,
  CreateStaffDutyDto,
} from "./dto/activities.dto";

@ApiTags("Co-Curricular & Activities")
@Controller("activities")
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("assembly")
  @ApiOperation({ summary: "Log a morning assembly" })
  @ApiResponse({ status: 201, description: "Assembly logged successfully" })
  createAssembly(@Body() dto: CreateAssemblyDto) {
    return this.activitiesService.createAssembly(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("assembly")
  @ApiOperation({ summary: "Get morning assemblies log" })
  @ApiQuery({ name: "campusId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of assemblies" })
  getAllAssemblies(@Query("campusId") campusId?: string) {
    return this.activitiesService.getAllAssemblies(campusId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("events")
  @ApiOperation({ summary: "Schedule a school event/competition" })
  @ApiResponse({ status: 201, description: "Event scheduled successfully" })
  createSchoolEvent(@Body() dto: CreateSchoolEventDto) {
    return this.activitiesService.createSchoolEvent(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("events")
  @ApiOperation({ summary: "List school calendar events" })
  @ApiQuery({ name: "campusId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of events" })
  getAllSchoolEvents(@Query("campusId") campusId?: string) {
    return this.activitiesService.getAllSchoolEvents(campusId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("houses/:houseId/points")
  @ApiOperation({ summary: "Award points to a school house" })
  @ApiParam({ name: "houseId", format: "uuid" })
  @ApiResponse({ status: 200, description: "House points updated" })
  awardHousePoints(@Param("houseId") houseId: string, @Body() dto: AwardHousePointsDto) {
    return this.activitiesService.awardHousePoints(houseId, dto.points);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("houses/standings")
  @ApiOperation({ summary: "Get school houses leaderboards" })
  @ApiResponse({ status: 200, description: "House standings listing" })
  getHouseStandings() {
    return this.activitiesService.getHouseStandings();
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("achievements")
  @ApiOperation({ summary: "Record a student co-curricular achievement award" })
  @ApiResponse({ status: 201, description: "Achievement logged successfully" })
  createAchievement(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentAchievementDto) {
    return this.activitiesService.createAchievement(user.userId, dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("students/:studentId/achievements")
  @ApiOperation({ summary: "Get achievements for a student" })
  @ApiParam({ name: "studentId", format: "uuid" })
  @ApiResponse({ status: 200, description: "List of achievements" })
  getStudentAchievements(@Param("studentId") studentId: string) {
    return this.activitiesService.getStudentAchievements(studentId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("duties")
  @ApiOperation({ summary: "Allocate staff member to supervisory duty slot" })
  @ApiResponse({ status: 201, description: "Duty allocation recorded" })
  createStaffDuty(@Body() dto: CreateStaffDutyDto) {
    return this.activitiesService.createStaffDuty(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("duties")
  @ApiOperation({ summary: "Get duty allocation logs" })
  @ApiQuery({ name: "staffId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of duties" })
  getStaffDuties(@Query("staffId") staffId?: string) {
    return this.activitiesService.getStaffDuties(staffId);
  }
}
