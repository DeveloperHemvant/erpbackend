import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { VisitorService } from "./visitor.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { CreateVisitorDto, ConfirmVisitorDto, CreateStudentGatePassDto } from "./dto/visitor.dto";

@ApiTags("Visitor Operations")
@Controller("visitor")
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @RequirePermissions("MANAGE_VISITORS")
  @Post()
  @ApiOperation({ summary: "Register a new campus visitor entry" })
  @ApiResponse({ status: 201, description: "Visitor logged successfully" })
  createVisitor(@Body() dto: CreateVisitorDto) {
    return this.visitorService.createVisitor(dto);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch(":id/confirm")
  @ApiOperation({ summary: "Confirm or reject visitor access" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Status updated successfully" })
  confirmVisitor(@Param("id") id: string, @Body() dto: ConfirmVisitorDto) {
    return this.visitorService.confirmVisitor(id, dto.status);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch(":id/exit")
  @ApiOperation({ summary: "Record checkout of a visitor" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Visitor checked out" })
  checkOutVisitor(@Param("id") id: string) {
    return this.visitorService.checkOutVisitor(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get()
  @ApiOperation({ summary: "Retrieve all visitor logs" })
  @ApiResponse({ status: 200, description: "List of visitor records" })
  getAllVisitors() {
    return this.visitorService.getAllVisitors();
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get(":id")
  @ApiOperation({ summary: "Get detailed log of a visitor" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Visitor record details" })
  getVisitorById(@Param("id") id: string) {
    return this.visitorService.getVisitorById(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Post("gate-pass")
  @ApiOperation({ summary: "Issue an early exit gate pass for a student" })
  @ApiResponse({ status: 201, description: "Gate pass issued" })
  createGatePass(@Body() dto: CreateStudentGatePassDto, @CurrentUser() user: AuthenticatedUser) {
    return this.visitorService.createGatePass(user.userId, dto);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch("gate-pass/:id/exit")
  @ApiOperation({ summary: "Log student early gate pass departure" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Departure time stamped" })
  verifyGatePassExit(@Param("id") id: string) {
    return this.visitorService.verifyGatePassExit(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch("gate-pass/:id/return")
  @ApiOperation({ summary: "Log student return from gate pass leave" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Return time stamped" })
  recordGatePassReturn(@Param("id") id: string) {
    return this.visitorService.recordGatePassReturn(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get("gate-pass")
  @ApiOperation({ summary: "List all active/historical gate passes" })
  @ApiResponse({ status: 200, description: "List of student gate passes" })
  getAllGatePasses() {
    return this.visitorService.getAllGatePasses();
  }
}
