import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEntity(entityType: string, entityId: string) {
    return this.prisma.comment.findMany({
      where: { entityType, entityId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
  }

  create(data: Prisma.CommentUncheckedCreateInput) {
    return this.prisma.comment.create({
      data,
      include: { author: true },
    });
  }
}
