import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttachmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEntity(entityType: string, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId },
      include: { uploadedBy: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.attachment.findUnique({ where: { id } });
  }

  create(data: Prisma.AttachmentUncheckedCreateInput) {
    return this.prisma.attachment.create({
      data,
      include: { uploadedBy: true },
    });
  }

  delete(id: string) {
    return this.prisma.attachment.delete({ where: { id } });
  }
}
