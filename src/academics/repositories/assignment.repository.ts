import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AssignmentUncheckedCreateInput) {
    return this.prisma.assignment.create({
      data,
      include: { subject: { include: { classes: { include: { class: true } } } } },
    });
  }

  findAll() {
    return this.prisma.assignment.findMany({
      include: { subject: { include: { classes: { include: { class: true } } } } },
      orderBy: { dueDate: "asc" },
    });
  }

  delete(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
