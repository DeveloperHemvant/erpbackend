import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  createDiaryEntry(data: Prisma.SchoolDiaryEntryUncheckedCreateInput) {
    return this.prisma.schoolDiaryEntry.create({
      data,
      include: { student: true, teacher: true },
    });
  }

  findDiaryEntries(where?: Prisma.SchoolDiaryEntryWhereInput) {
    return this.prisma.schoolDiaryEntry.findMany({
      where,
      include: { student: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateDiaryEntry(
    id: string,
    data: Prisma.SchoolDiaryEntryUncheckedUpdateInput,
  ) {
    return this.prisma.schoolDiaryEntry.update({ where: { id }, data });
  }

  createNewsItem(data: Prisma.DailyNewsItemCreateInput) {
    return this.prisma.dailyNewsItem.create({ data });
  }

  findNewsItems(where?: Prisma.DailyNewsItemWhereInput) {
    return this.prisma.dailyNewsItem.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  createLostFound(data: Prisma.LostFoundItemUncheckedCreateInput) {
    return this.prisma.lostFoundItem.create({
      data,
      include: { reporter: true },
    });
  }

  findLostFound(where?: Prisma.LostFoundItemWhereInput) {
    return this.prisma.lostFoundItem.findMany({
      where,
      include: { reporter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateLostFound(id: string, data: Prisma.LostFoundItemUncheckedUpdateInput) {
    return this.prisma.lostFoundItem.update({ where: { id }, data });
  }

  createDocLifecycle(data: Prisma.DocumentLifecycleUncheckedCreateInput) {
    return this.prisma.documentLifecycle.create({ data });
  }

  findDocLifecycles(where?: Prisma.DocumentLifecycleWhereInput) {
    return this.prisma.documentLifecycle.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });
  }

  updateDocLifecycle(
    id: string,
    data: Prisma.DocumentLifecycleUncheckedUpdateInput,
  ) {
    return this.prisma.documentLifecycle.update({ where: { id }, data });
  }
}
