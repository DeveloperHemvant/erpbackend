import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEntityType(entityType: string) {
    return this.prisma.workflowDefinition.findFirst({ where: { entityType } });
  }

  findAll() {
    return this.prisma.workflowDefinition.findMany();
  }

  upsert(
    entityType: string,
    name: string,
    data: Prisma.WorkflowDefinitionUncheckedCreateInput,
  ) {
    return this.prisma.workflowDefinition.upsert({
      where: { entityType_name: { entityType, name } },
      create: data,
      update: { stages: data.stages, transitions: data.transitions },
    });
  }
}
