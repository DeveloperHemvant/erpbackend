import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RuleRepository } from './repositories/rule.repository';

type Op = '==' | '!=' | '>=' | '<=' | '>' | '<';

interface RuleCondition {
  field: string;
  op: Op;
  value: unknown;
  then: Record<string, unknown>;
}

interface RuleDefinition {
  conditions: RuleCondition[];
  default: Record<string, unknown>;
}

function compare(actual: unknown, op: Op, expected: unknown): boolean {
  switch (op) {
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    case '>=':
      return (actual as number) >= (expected as number);
    case '<=':
      return (actual as number) <= (expected as number);
    case '>':
      return (actual as number) > (expected as number);
    case '<':
      return (actual as number) < (expected as number);
  }
}

/**
 * Rules Engine (IA §16, Appendix A.2) — a small declarative comparator for
 * conditional business math/eligibility, distinct from Workflow Engine
 * (which governs *stage transitions*). Seeded on boot with one real rule
 * mirroring the sibling/staff-child fee concession logic already live,
 * today, client-side only, in web-app/app/dashboard/fees/page.tsx's
 * getConcessionDetails — proves the engine against a real existing policy
 * without touching the working client-side calculator that page still uses.
 */
@Injectable()
export class RulesEngineService implements OnModuleInit {
  constructor(private readonly repository: RuleRepository) {}

  async onModuleInit() {
    const definition: RuleDefinition = {
      conditions: [
        {
          field: 'isStaffChild',
          op: '==',
          value: true,
          then: {
            discountPercent: 100,
            reason: 'Staff Child Concession (100% Free)',
          },
        },
        {
          field: 'siblingCount',
          op: '>=',
          value: 3,
          then: {
            discountPercent: 100,
            reason: 'Sibling Concession (3+ children: 100% Free)',
          },
        },
        {
          field: 'siblingCount',
          op: '==',
          value: 2,
          then: {
            discountPercent: 20,
            reason: 'Sibling Concession (2 children: 20% Discount)',
          },
        },
      ],
      default: { discountPercent: 0, reason: 'None' },
    };
    await this.repository.upsert('sibling-discount', {
      key: 'sibling-discount',
      entityType: 'invoice',
      description:
        'Fee concession: staff-child and sibling-count based tuition discount',
      definition: definition as any,
      active: true,
    });
  }

  async evaluate(key: string, context: Record<string, unknown>) {
    const rule = await this.repository.findByKey(key);
    if (!rule || !rule.active)
      throw new NotFoundException(`No active rule found for key "${key}".`);

    const definition = rule.definition as unknown as RuleDefinition;
    for (const condition of definition.conditions) {
      if (compare(context[condition.field], condition.op, condition.value)) {
        return { key, matched: true, result: condition.then };
      }
    }
    return { key, matched: false, result: definition.default };
  }
}
