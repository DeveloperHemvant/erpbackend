// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { AcademicsService } from "./academics.service";
import { CreateAssignmentDto } from "./dto/assignment.dto";

@ApiTags("ERP Core Features")
@Controller("erp-core")
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Post("assignments")
  @ApiOperation({ summary: "Onboard new class assignment" })
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.academicsService.createAssignment(dto);
  }

  @Get("assignments")
  @ApiOperation({ summary: "List all active assignments" })
  getAssignments() {
    return this.academicsService.getAssignments();
  }

  @Delete("assignments/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteAssignment(@Param("id", ParseUUIDPipe) id: string) {
    return this.academicsService.deleteAssignment(id);
  }
}
