import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { SubstitutionService } from "./substitution.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CreateSubstitutionDto } from "./dto/substitution.dto";

@Controller("substitution")
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  @RequirePermissions("MANAGE_TIMETABLE")
  @Post()
  createSubstitution(@Body() dto: CreateSubstitutionDto) {
    return this.substitutionService.createSubstitution(dto);
  }

  @RequirePermissions("MANAGE_TIMETABLE")
  @Get()
  getSubstitutions(@Query("teacherId") teacherId?: string) {
    return this.substitutionService.getSubstitutions(teacherId);
  }

  @RequirePermissions("MANAGE_TIMETABLE")
  @Get("available-teachers")
  getAvailableTeachers(@Query("timetablePeriodId") timetablePeriodId: string) {
    return this.substitutionService.getAvailableSubstituteTeachers(timetablePeriodId);
  }
}
