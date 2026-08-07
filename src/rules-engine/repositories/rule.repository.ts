import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(key: string) {
    return this.prisma.rule.findUnique({ where: { key } });
  }

  findAll() {
    return this.prisma.rule.findMany();
  }

  upsert(key: string, data: Prisma.RuleUncheckedCreateInput) {
    return this.prisma.rule.upsert({
      where: { key },
      create: data,
      update: {
        description: data.description,
        definition: data.definition,
        active: data.active,
      },
    });
  }
}
