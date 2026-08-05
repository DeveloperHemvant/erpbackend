import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
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

@Controller("activities")
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("assembly")
  createAssembly(@Body() dto: CreateAssemblyDto) {
    return this.activitiesService.createAssembly(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("assembly")
  getAllAssemblies(@Query("campusId") campusId?: string) {
    return this.activitiesService.getAllAssemblies(campusId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("events")
  createSchoolEvent(@Body() dto: CreateSchoolEventDto) {
    return this.activitiesService.createSchoolEvent(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("events")
  getAllSchoolEvents(@Query("campusId") campusId?: string) {
    return this.activitiesService.getAllSchoolEvents(campusId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("houses/:houseId/points")
  awardHousePoints(@Param("houseId") houseId: string, @Body() dto: AwardHousePointsDto) {
    return this.activitiesService.awardHousePoints(houseId, dto.points);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("houses/standings")
  getHouseStandings() {
    return this.activitiesService.getHouseStandings();
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("achievements")
  createAchievement(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentAchievementDto) {
    return this.activitiesService.createAchievement(user.userId, dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("students/:studentId/achievements")
  getStudentAchievements(@Param("studentId") studentId: string) {
    return this.activitiesService.getStudentAchievements(studentId);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Post("duties")
  createStaffDuty(@Body() dto: CreateStaffDutyDto) {
    return this.activitiesService.createStaffDuty(dto);
  }

  @RequirePermissions("MANAGE_ACTIVITIES")
  @Get("duties")
  getStaffDuties(@Query("staffId") staffId?: string) {
    return this.activitiesService.getStaffDuties(staffId);
  }
}
