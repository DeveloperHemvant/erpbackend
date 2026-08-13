import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const include = {
  teacher: { select: { id: true, fullName: true } },
  parent: { select: { id: true, name: true } },
  student: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class PTMRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PTMSlotUncheckedCreateInput) {
    return this.prisma.pTMSlot.create({ data, include });
  }

  findById(id: string) {
    return this.prisma.pTMSlot.findUnique({ where: { id }, include });
  }

  findByTeacher(teacherId: string) {
    return this.prisma.pTMSlot.findMany({
      where: { teacherId },
      include,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  findOpenByTeacher(teacherId: string) {
    return this.prisma.pTMSlot.findMany({
      where: { teacherId, status: 'Open' },
      include,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  findByParent(parentId: string) {
    return this.prisma.pTMSlot.findMany({
      where: { parentId },
      include,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  book(id: string, parentId: string, studentId: string) {
    return this.prisma.pTMSlot.update({
      where: { id },
      data: { status: 'Booked', parentId, studentId, bookedAt: new Date() },
      include,
    });
  }

  cancel(id: string) {
    return this.prisma.pTMSlot.update({
      where: { id },
      data: { status: 'Open', parentId: null, studentId: null, bookedAt: null },
      include,
    });
  }

  delete(id: string) {
    return this.prisma.pTMSlot.delete({ where: { id } });
  }
}
