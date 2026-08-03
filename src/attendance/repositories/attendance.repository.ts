import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCampus() {
    return this.prisma.campus.findFirst();
  }

  create(data: Prisma.AttendanceRecordUncheckedCreateInput) {
    return this.prisma.attendanceRecord.create({
      data,
      include: { enrollment: { include: { student: true, section: { include: { class: true } } } }, staff: true },
    });
  }

  findMany(where: Prisma.AttendanceRecordWhereInput) {
    return this.prisma.attendanceRecord.findMany({
      where,
      include: { enrollment: { include: { student: true, section: { include: { class: true } } } }, staff: true },
      orderBy: { date: "desc" },
    });
  }

  delete(id: string) {
    return this.prisma.attendanceRecord.delete({ where: { id } });
  }
}
