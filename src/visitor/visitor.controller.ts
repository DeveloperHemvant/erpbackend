import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { VisitorService } from "./visitor.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { CreateVisitorDto, ConfirmVisitorDto, CreateStudentGatePassDto } from "./dto/visitor.dto";

@Controller("visitor")
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @RequirePermissions("MANAGE_VISITORS")
  @Post()
  createVisitor(@Body() dto: CreateVisitorDto) {
    return this.visitorService.createVisitor(dto);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch(":id/confirm")
  confirmVisitor(@Param("id") id: string, @Body() dto: ConfirmVisitorDto) {
    return this.visitorService.confirmVisitor(id, dto.status);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch(":id/exit")
  checkOutVisitor(@Param("id") id: string) {
    return this.visitorService.checkOutVisitor(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get()
  getAllVisitors() {
    return this.visitorService.getAllVisitors();
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get(":id")
  getVisitorById(@Param("id") id: string) {
    return this.visitorService.getVisitorById(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Post("gate-pass")
  createGatePass(@Body() dto: CreateStudentGatePassDto, @CurrentUser() user: AuthenticatedUser) {
    return this.visitorService.createGatePass(user.userId, dto);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch("gate-pass/:id/exit")
  verifyGatePassExit(@Param("id") id: string) {
    return this.visitorService.verifyGatePassExit(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Patch("gate-pass/:id/return")
  recordGatePassReturn(@Param("id") id: string) {
    return this.visitorService.recordGatePassReturn(id);
  }

  @RequirePermissions("MANAGE_VISITORS")
  @Get("gate-pass")
  getAllGatePasses() {
    return this.visitorService.getAllGatePasses();
  }
}
