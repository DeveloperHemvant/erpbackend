import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { SubstitutionService } from "./substitution.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CreateSubstitutionDto } from "./dto/substitution.dto";

@ApiTags("Timetable & Substitution")
@Controller("substitution")
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  @RequirePermissions("MANAGE_TIMETABLE")
  @Post()
  @ApiOperation({ summary: "Assign a substitute teacher to a slot" })
  @ApiResponse({ status: 201, description: "Substitution scheduled" })
  createSubstitution(@Body() dto: CreateSubstitutionDto) {
    return this.substitutionService.createSubstitution(dto);
  }

  @RequirePermissions("MANAGE_TIMETABLE")
  @Get()
  @ApiOperation({ summary: "Query timetable substitutions" })
  @ApiQuery({ name: "teacherId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of substitutions retrieved" })
  getSubstitutions(@Query("teacherId") teacherId?: string) {
    return this.substitutionService.getSubstitutions(teacherId);
  }

  @RequirePermissions("MANAGE_TIMETABLE")
  @Get("available-teachers")
  @ApiOperation({ summary: "Identify available free teachers for a specific period" })
  @ApiQuery({ name: "timetablePeriodId", required: true, type: String })
  @ApiResponse({ status: 200, description: "List of free teachers" })
  getAvailableTeachers(@Query("timetablePeriodId") timetablePeriodId: string) {
    return this.substitutionService.getAvailableSubstituteTeachers(timetablePeriodId);
  }
}
