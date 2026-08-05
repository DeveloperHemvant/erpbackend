import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { WorkflowEngineService } from "./workflow-engine.service";
import { ValidateTransitionDto } from "./dto/workflow.dto";
import { RequirePermissions } from "../auth/permissions.decorator";

@Controller("workflow-engine")
export class WorkflowEngineController {
  constructor(private readonly workflowEngineService: WorkflowEngineService) {}

  @Get("definitions/:entityType")
  @RequirePermissions()
  getDefinition(@Param("entityType") entityType: string) {
    return this.workflowEngineService.getDefinition(entityType);
  }

  @Post("validate")
  @RequirePermissions()
  validateTransition(@Body() dto: ValidateTransitionDto) {
    return this.workflowEngineService.validateTransition(dto.entityType, dto.fromStage, dto.toStage);
  }
}
