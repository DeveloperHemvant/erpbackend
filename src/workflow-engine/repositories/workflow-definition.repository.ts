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

  findById(id: string) {
    return this.prisma.workflowDefinition.findUnique({ where: { id } });
  }

  findByEntityTypeAndName(entityType: string, name: string) {
    return this.prisma.workflowDefinition.findUnique({
      where: { entityType_name: { entityType, name } },
    });
  }

  create(data: Prisma.WorkflowDefinitionUncheckedCreateInput) {
    return this.prisma.workflowDefinition.create({ data });
  }

  update(id: string, data: Prisma.WorkflowDefinitionUncheckedUpdateInput) {
    return this.prisma.workflowDefinition.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.workflowDefinition.delete({ where: { id } });
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
