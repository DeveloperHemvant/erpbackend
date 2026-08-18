import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import {
  ValidateTransitionDto,
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
} from './dto/workflow.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

@RequirePermissions('MANAGE_WORKFLOWS')
@Controller('workflow-engine')
export class WorkflowEngineController {
  constructor(private readonly workflowEngineService: WorkflowEngineService) {}

  @Get('definitions')
  getAllDefinitions() {
    return this.workflowEngineService.getAllDefinitions();
  }

  @Get('definitions/:entityType')
  getDefinition(@Param('entityType') entityType: string) {
    return this.workflowEngineService.getDefinition(entityType);
  }

  @Post('definitions')
  createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    return this.workflowEngineService.createDefinition(dto);
  }

  @Patch('definitions/:id')
  updateDefinition(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDefinitionDto,
  ) {
    return this.workflowEngineService.updateDefinition(id, dto);
  }

  @Delete('definitions/:id')
  deleteDefinition(@Param('id') id: string) {
    return this.workflowEngineService.deleteDefinition(id);
  }

  @Post('validate')
  validateTransition(@Body() dto: ValidateTransitionDto) {
    return this.workflowEngineService.validateTransition(
      dto.entityType,
      dto.fromStage,
      dto.toStage,
    );
  }
}
