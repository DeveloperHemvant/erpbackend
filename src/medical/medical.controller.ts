import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { MedicalService } from "./medical.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { CreateMedicalVisitDto } from "./dto/medical.dto";

@Controller("medical")
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @RequirePermissions("MANAGE_HEALTH")
  @Post("visits")
  createVisit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMedicalVisitDto) {
    return this.medicalService.createVisit(user.userId, dto);
  }

  @RequirePermissions("MANAGE_HEALTH")
  @Get("visits")
  getVisits(@Query("studentId") studentId?: string) {
    return this.medicalService.getVisits(studentId);
  }
}
