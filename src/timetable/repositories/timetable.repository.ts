import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TimetableRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSlot(data: Prisma.TimetableSlotUncheckedCreateInput) {
    return this.prisma.timetableSlot.create({ data, include: { session: true } });
  }

  createSlotBulkItem(data: Prisma.TimetableSlotUncheckedCreateInput) {
    return this.prisma.timetableSlot.create({ data });
  }

  findAllSlots() {
    return this.prisma.timetableSlot.findMany({
      include: { session: true },
      orderBy: { startTime: "asc" },
    });
  }

  deleteSlot(id: string) {
    return this.prisma.timetableSlot.delete({ where: { id } });
  }

  deleteSlotsBySession(sessionId: string) {
    return this.prisma.timetableSlot.deleteMany({ where: { sessionId } });
  }

  findNonBreakSlotsBySession(sessionId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { sessionId, isBreak: false },
      orderBy: { startTime: "asc" },
    });
  }

  createTimetable(data: Prisma.TimetableUncheckedCreateInput) {
    return this.prisma.timetable.create({ data, include: { session: true, periods: true } });
  }

  findAllTimetables() {
    return this.prisma.timetable.findMany({
      include: { session: true, periods: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findTimetableById(id: string) {
    return this.prisma.timetable.findUnique({ where: { id } });
  }

  findTimetableByIdWithSession(id: string) {
    return this.prisma.timetable.findUnique({ where: { id }, include: { session: true } });
  }

  deactivateTimetablesInSession(sessionId: string) {
    return this.prisma.timetable.updateMany({ where: { sessionId }, data: { status: "Draft" } });
  }

  activateTimetable(id: string) {
    return this.prisma.timetable.update({ where: { id }, data: { status: "Active" } });
  }

  deletePeriodsByTimetable(timetableId: string) {
    return this.prisma.timetablePeriod.deleteMany({ where: { timetableId } });
  }

  findSectionsBySession(sessionId: string) {
    return this.prisma.section.findMany({ where: { class: { sessionId } } });
  }

  findTeacherAssignmentsBySession(sessionId: string) {
    return this.prisma.teacherAssignment.findMany({ where: { sessionId } });
  }

  findClassSubjectsBySession(sessionId: string) {
    return this.prisma.classSubject.findMany({ where: { class: { sessionId } } });
  }

  createManyPeriods(data: Prisma.TimetablePeriodUncheckedCreateInput[]) {
    return this.prisma.timetablePeriod.createMany({ data });
  }

  findTeacherAssignmentById(id: string) {
    return this.prisma.teacherAssignment.findUnique({ where: { id } });
  }

  findClashingPeriods(staffId: string, dayOfWeek: string, startTime: string, endTime: string) {
    return this.prisma.timetablePeriod.findMany({
      where: {
        assignment: { staffId },
        dayOfWeek,
        NOT: {
          OR: [{ endTime: { lte: startTime } }, { startTime: { gte: endTime } }],
        },
      },
    });
  }

  createPeriod(data: Prisma.TimetablePeriodUncheckedCreateInput) {
    return this.prisma.timetablePeriod.create({
      data,
      include: { section: true, subject: true, assignment: { include: { staff: true } }, timetable: true },
    });
  }

  findTeacherAssignmentsForSubject(subjectId: string) {
    return this.prisma.teacherAssignment.findMany({
      where: { subjectId, status: "Active" },
      include: { staff: true },
    });
  }

  findBusyPeriods(teacherIds: string[], dayOfWeek: string, startTime: string, endTime: string) {
    return this.prisma.timetablePeriod.findMany({
      where: {
        assignment: { staffId: { in: teacherIds } },
        dayOfWeek,
        NOT: {
          OR: [{ endTime: { lte: startTime } }, { startTime: { gte: endTime } }],
        },
      },
      include: { assignment: true },
    });
  }

  findAllPeriods() {
    return this.prisma.timetablePeriod.findMany({
      include: { section: true, subject: true, assignment: { include: { staff: true } }, timetable: true },
      orderBy: { startTime: "asc" },
    });
  }

  deletePeriod(id: string) {
    return this.prisma.timetablePeriod.delete({ where: { id } });
  }
}
