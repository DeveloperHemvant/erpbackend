import { Injectable, BadRequestException } from "@nestjs/common";
import { ExamRepository } from "./repositories/exam.repository";
import { CreateExamDto, CreateExamSlotDto, SubmitExamMarksDto } from "./dto/exam.dto";

@Injectable()
export class ExamsService {
  constructor(private readonly examRepository: ExamRepository) {}

  async createExam(dto: CreateExamDto) {
    return this.examRepository.createExam({ ...dto, createdBy: "SYSTEM" });
  }

  async getExams() {
    return this.examRepository.findAllExams();
  }

  async createExamSlot(dto: CreateExamSlotDto) {
    // Basic clash validation: Check if room is already booked for this date and time
    const existing = await this.examRepository.findClashingSlot(dto.date, dto.room, dto.startTime, dto.endTime);

    if (existing) {
      throw new BadRequestException(`Room ${dto.room} is already booked for another exam at this time.`);
    }

    return this.examRepository.createExamSlot({ ...dto, createdBy: "SYSTEM" });
  }

  async getExamSlots() {
    return this.examRepository.findAllExamSlots();
  }

  async submitExamMarks(dto: SubmitExamMarksDto) {
    let count = 0;
    for (const mark of dto.marks) {
      // Upsert marks
      const existing = await this.examRepository.findExamMarkByEnrollment(dto.examSlotId, mark.enrollmentId);
      if (existing) {
        await this.examRepository.updateExamMark(existing.id, mark.marksObtained, mark.isAbsent);
      } else {
        await this.examRepository.createExamMark(dto.examSlotId, mark.enrollmentId, mark.marksObtained, mark.isAbsent);
      }
      count++;
    }
    return { success: true, count };
  }

  async getExamMarks(examSlotId: string) {
    return this.examRepository.findMarksBySlot(examSlotId);
  }
}
