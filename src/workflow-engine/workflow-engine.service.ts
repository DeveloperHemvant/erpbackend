import { Injectable, OnModuleInit } from '@nestjs/common';
import { WorkflowDefinitionRepository } from './repositories/workflow-definition.repository';

interface Transition {
  from: string;
  to: string;
}

/**
 * Workflow Engine (IA §16 #4, Appendix A.2) — stage/transition definitions as
 * data, one engine evaluates them. Seeded on boot with 2 real definitions
 * mirroring existing flows (Admissions Pipeline, Discipline Case) so this is
 * provably real, not vaporware — but admission-inquiry.service.ts and
 * discipline.service.ts keep their own working inline transition logic in
 * this pass; they are not rewired to depend on this engine yet
 * (docs/PHASE8_WORKFLOW_RULES_ENGINE.md explains why).
 */
@Injectable()
export class WorkflowEngineService implements OnModuleInit {
  constructor(private readonly repository: WorkflowDefinitionRepository) {}

  async onModuleInit() {
    await this.repository.upsert('applicant', 'Admissions Pipeline', {
      entityType: 'applicant',
      name: 'Admissions Pipeline',
      stages: [
        'New',
        'Contacted',
        'Campus Visit Scheduled',
        'Application Sent',
        'Converted',
        'Lost',
      ],
      transitions: [
        { from: 'New', to: 'Contacted' },
        { from: 'Contacted', to: 'Campus Visit Scheduled' },
        { from: 'Campus Visit Scheduled', to: 'Application Sent' },
        { from: 'Application Sent', to: 'Converted' },
        { from: 'New', to: 'Lost' },
        { from: 'Contacted', to: 'Lost' },
        { from: 'Campus Visit Scheduled', to: 'Lost' },
        { from: 'Application Sent', to: 'Lost' },
      ] satisfies Transition[],
    });

    await this.repository.upsert('discipline-case', 'Discipline Case', {
      entityType: 'discipline-case',
      name: 'Discipline Case',
      stages: ['Open', 'Resolved', 'Escalated'],
      transitions: [
        { from: 'Open', to: 'Resolved' },
        { from: 'Open', to: 'Escalated' },
        { from: 'Escalated', to: 'Resolved' },
      ] satisfies Transition[],
    });
  }

  async getDefinition(entityType: string) {
    return this.repository.findByEntityType(entityType);
  }

  async validateTransition(
    entityType: string,
    fromStage: string,
    toStage: string,
  ) {
    const definition = await this.repository.findByEntityType(entityType);
    if (!definition) {
      return {
        valid: false,
        reason: `No workflow definition registered for entity type "${entityType}".`,
      };
    }
    const transitions = definition.transitions as unknown as Transition[];
    const stages = definition.stages as unknown as string[];

    if (!stages.includes(fromStage) || !stages.includes(toStage)) {
      return { valid: false, reason: 'Unknown stage for this entity type.' };
    }
    const legal = transitions.some(
      (t) => t.from === fromStage && t.to === toStage,
    );
    return legal
      ? { valid: true }
      : {
          valid: false,
          reason: `"${fromStage}" → "${toStage}" is not a legal transition for ${definition.name}.`,
        };
  }
}
