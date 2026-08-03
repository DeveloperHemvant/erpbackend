import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { HealthRecordsService } from "./health-records.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { RequireStudentAccessOrPermission } from "../auth/student-access-or-permission.decorator";
import { StudentAccessOrPermissionGuard } from "../auth/student-access-or-permission.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { UpsertHealthProfileDto, CreateHealthVisitDto, CreateVaccinationDto } from "./dto/health-records.dto";

// Staff-only by default (nurse/pastoral-care desk); the three GET routes are
// overridden to also allow the student themself or their parent to view it.
@RequirePermissions("MANAGE_HEALTH_RECORDS")
@Controller("health-records")
export class HealthRecordsController {
  constructor(private readonly healthRecordsService: HealthRecordsService) {}

  @Get("students/:studentId/profile")
  @UseGuards(StudentAccessOrPermissionGuard)
  @RequireStudentAccessOrPermission("studentId", "MANAGE_HEALTH_RECORDS")
  @RequirePermissions()
  getProfile(@Param("studentId") studentId: string) {
    return this.healthRecordsService.getProfile(studentId);
  }

  @Post("students/:studentId/profile")
  upsertProfile(@Param("studentId") studentId: string, @Body() dto: UpsertHealthProfileDto) {
    return this.healthRecordsService.upsertProfile(studentId, dto);
  }

  @Get("students/:studentId/visits")
  @UseGuards(StudentAccessOrPermissionGuard)
  @RequireStudentAccessOrPermission("studentId", "MANAGE_HEALTH_RECORDS")
  @RequirePermissions()
  getVisits(@Param("studentId") studentId: string) {
    return this.healthRecordsService.getVisitsForStudent(studentId);
  }

  @Post("students/:studentId/visits")
  logVisit(@Param("studentId") studentId: string, @Body() dto: CreateHealthVisitDto, @CurrentUser() user: AuthenticatedUser) {
    return this.healthRecordsService.logVisit(studentId, user.userId, dto);
  }

  @Get("visits/today")
  getVisitsToday() {
    return this.healthRecordsService.getVisitsToday();
  }

  @Get("students/:studentId/vaccinations")
  @UseGuards(StudentAccessOrPermissionGuard)
  @RequireStudentAccessOrPermission("studentId", "MANAGE_HEALTH_RECORDS")
  @RequirePermissions()
  getVaccinations(@Param("studentId") studentId: string) {
    return this.healthRecordsService.getVaccinationsForStudent(studentId);
  }

  @Post("students/:studentId/vaccinations")
  addVaccination(@Param("studentId") studentId: string, @Body() dto: CreateVaccinationDto) {
    return this.healthRecordsService.addVaccination(studentId, dto);
  }
}
