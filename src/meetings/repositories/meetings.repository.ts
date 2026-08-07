import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MeetingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MeetingUncheckedCreateInput) {
    return this.prisma.meeting.create({ data });
  }

  findAll() {
    return this.prisma.meeting.findMany({
      include: { organizer: { select: { id: true, fullName: true } } },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  update(id: string, data: Prisma.MeetingUncheckedUpdateInput) {
    return this.prisma.meeting.update({ where: { id }, data });
  }
}
