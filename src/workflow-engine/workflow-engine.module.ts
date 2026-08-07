import { Module } from '@nestjs/common';
import { WorkflowEngineController } from './workflow-engine.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowDefinitionRepository } from './repositories/workflow-definition.repository';

@Module({
  controllers: [WorkflowEngineController],
  providers: [WorkflowEngineService, WorkflowDefinitionRepository],
  exports: [WorkflowEngineService],
})
export class WorkflowEngineModule {}
