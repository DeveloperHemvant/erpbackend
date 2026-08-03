import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExamRepository {
  constructor(private readonly prisma: PrismaService) {}

  createExam(data: Prisma.ExamUncheckedCreateInput) {
    return this.prisma.exam.create({ data });
  }

  findAllExams() {
    return this.prisma.exam.findMany({ include: { session: true }, orderBy: { createdAt: "desc" } });
  }

  findClashingSlot(date: string, room: string, startTime: string, endTime: string) {
    return this.prisma.examSlot.findFirst({
      where: {
        date,
        room,
        OR: [{ startTime: { lte: endTime }, endTime: { gte: startTime } }],
      },
    });
  }

  createExamSlot(data: Prisma.ExamSlotUncheckedCreateInput) {
    return this.prisma.examSlot.create({ data });
  }

  findAllExamSlots() {
    return this.prisma.examSlot.findMany({
      include: { exam: true, class: true, subject: true },
      orderBy: { date: "asc" },
    });
  }

  findExamMarkByEnrollment(examSlotId: string, enrollmentId: string) {
    return this.prisma.examMarks.findFirst({ where: { examSlotId, enrollmentId } });
  }

  updateExamMark(id: string, marksObtained: number | undefined, isAbsent: boolean | undefined) {
    return this.prisma.examMarks.update({ where: { id }, data: { marksObtained, isAbsent } });
  }

  createExamMark(examSlotId: string, enrollmentId: string, marksObtained: number | undefined, isAbsent: boolean | undefined) {
    return this.prisma.examMarks.create({
      data: {
        examSlotId,
        enrollmentId,
        marksObtained,
        isAbsent,
        createdBy: "SYSTEM",
      },
    });
  }

  findMarksBySlot(examSlotId: string) {
    return this.prisma.examMarks.findMany({
      where: { examSlotId },
      include: { enrollment: { include: { student: true } } },
    });
  }

  findMarksForReportCard(enrollmentId: string, examId: string) {
    return this.prisma.examMarks.findMany({
      where: { enrollmentId, examSlot: { examId } },
      include: { examSlot: { include: { subject: true } } },
    });
  }
}
