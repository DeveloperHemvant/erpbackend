import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommunicationService } from '../communication/communication.service';
import { ExamRepository } from '../exams/repositories/exam.repository';
import { ReportCardRepository } from './repositories/report-card.repository';
import { CreateReportCardDto } from './dto/report-card.dto';

@Injectable()
export class ReportCardsService {
  constructor(
    private readonly commService: CommunicationService,
    private readonly examRepository: ExamRepository,
    private readonly reportCardRepository: ReportCardRepository,
  ) {}

  async createReportCard(dto: CreateReportCardDto) {
    return this.reportCardRepository.createFromDto({
      enrollmentId: dto.studentId,
      attendanceRate: dto.attendanceRate,
      gpa: dto.gpa,
      remarks: dto.remarks || null,
      isApproved: dto.isApproved || false,
      createdBy: 'SYSTEM',
    });
  }

  async getReportCards() {
    return this.reportCardRepository.findAll();
  }

  async updateReportCardApproval(
    id: string,
    isApproved: boolean,
    remarks?: string,
  ) {
    const card = await this.reportCardRepository.findById(id);
    if (!card) throw new NotFoundException('Report card not found.');

    return this.reportCardRepository.updateApproval(id, isApproved, remarks);
  }

  async deleteReportCard(id: string) {
    return this.reportCardRepository.delete(id);
  }

  async generateReportCard(enrollmentId: string, examId: string) {
    const marks = await this.examRepository.findMarksForReportCard(
      enrollmentId,
      examId,
    );

    if (marks.length === 0) {
      throw new BadRequestException(
        'No marks found for this student in this exam.',
      );
    }

    let totalMarks = 0;
    const maxMarks = marks.length * 100; // assuming each subject is out of 100
    const computedData: any = { subjects: [] };

    marks.forEach((m) => {
      totalMarks += m.isAbsent ? 0 : m.marksObtained || 0;
      computedData.subjects.push({
        subject: m.examSlot.subject.name,
        marksObtained: m.marksObtained,
        isAbsent: m.isAbsent,
      });
    });

    const percentage = (totalMarks / maxMarks) * 100;
    let gpa = 'F';
    if (percentage >= 90) gpa = 'A+';
    else if (percentage >= 80) gpa = 'A';
    else if (percentage >= 70) gpa = 'B+';
    else if (percentage >= 60) gpa = 'B';
    else if (percentage >= 50) gpa = 'C';
    else if (percentage >= 40) gpa = 'D';

    computedData.percentage = percentage.toFixed(2);
    computedData.totalMarks = totalMarks;

    const existingCard =
      await this.reportCardRepository.findByEnrollmentAndExam(
        enrollmentId,
        examId,
      );

    if (existingCard) {
      const updatedCard = await this.reportCardRepository.updateComputed(
        existingCard.id,
        gpa,
        computedData,
      );

      if (updatedCard.enrollment?.studentId && updatedCard.exam?.name) {
        this.commService
          .sendGradeAlert(
            updatedCard.enrollment.studentId,
            updatedCard.exam.name,
          )
          .catch(console.error);
      }
      return updatedCard;
    }

    const newCard = await this.reportCardRepository.createComputed(
      enrollmentId,
      examId,
      '95%',
      gpa,
      computedData,
    );

    if (newCard.enrollment?.studentId && newCard.exam?.name) {
      this.commService
        .sendGradeAlert(newCard.enrollment.studentId, newCard.exam.name)
        .catch(console.error);
    }
    return newCard;
  }
}
