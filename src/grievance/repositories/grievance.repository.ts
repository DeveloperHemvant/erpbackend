import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const assigneeSelect = { id: true, fullName: true, email: true } as const;

@Injectable()
export class GrievanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.GrievanceRecordUncheckedCreateInput) {
    return this.prisma.grievanceRecord.create({
      data,
      include: { assignedTo: { select: assigneeSelect } },
    });
  }

  findById(id: string) {
    return this.prisma.grievanceRecord.findUnique({
      where: { id },
      include: { assignedTo: { select: assigneeSelect } },
    });
  }

  findAll() {
    return this.prisma.grievanceRecord.findMany({
      include: { assignedTo: { select: assigneeSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByReporter(userType: string, reporterId: string) {
    return this.prisma.grievanceRecord.findMany({
      where: { userType, reporterId },
      include: { assignedTo: { select: assigneeSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByAssignee(assignedToId: string) {
    return this.prisma.grievanceRecord.findMany({
      where: { assignedToId },
      include: { assignedTo: { select: assigneeSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.GrievanceRecordUncheckedUpdateInput) {
    return this.prisma.grievanceRecord.update({
      where: { id },
      data,
      include: { assignedTo: { select: assigneeSelect } },
    });
  }
}
