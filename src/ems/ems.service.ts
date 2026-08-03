import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { EmsRepository } from "./repositories/ems.repository";
import { NotificationsService } from "../notifications/notifications.service";
import { OwnershipService } from "../auth/ownership.service";
import { AuthenticatedUser } from "../auth/current-user.decorator";
import {
  CreateEmsSessionDto,
  CreateEmsExamTypeDto,
  CreateEmsExamTemplateDto,
  CreateEmsQuestionBankDto,
  CreateEmsEvaluationDto,
  CreateEmsGradebookDto,
  GenerateEmsReportCardDto,
  CreateExamScheduleDto,
  CreateExamRoomDto,
  GenerateSeatingDto,
  CreateInvigilatorDto,
  CreateQuestionDto,
  CreateQuestionPaperDto,
  AddQuestionPaperItemDto,
  ActivateOnlineScheduleDto,
  SaveAnswerDto,
  GenerateAttemptsDto,
  UpdateEvaluationDto,
  CreateModerationDto,
  CreateGradingSchemeDto,
  ComputeResultsDto,
} from "./dto/ems.dto";

@Injectable()
export class EmsService {
  constructor(
    private readonly emsRepository: EmsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Exam Sessions ---
  async createSession(data: CreateEmsSessionDto) {
    return this.emsRepository.createSession({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  async getSessions() {
    return this.emsRepository.findAllSessions();
  }

  async deleteSession(id: string) {
    return this.emsRepository.deleteSession(id);
  }

  // --- Exam Types ---
  async createType(data: CreateEmsExamTypeDto) {
    return this.emsRepository.createType(data);
  }

  async getTypes() {
    return this.emsRepository.findAllTypes();
  }

  async deleteType(id: string) {
    return this.emsRepository.deleteType(id);
  }

  // --- Exam Templates ---
  async createTemplate(data: CreateEmsExamTemplateDto) {
    return this.emsRepository.createTemplate(data);
  }

  async getTemplates() {
    return this.emsRepository.findAllTemplates();
  }

  async deleteTemplate(id: string) {
    return this.emsRepository.deleteTemplate(id);
  }

  // --- Exam Schedules ---
  async createSchedule(data: CreateExamScheduleDto) {
    return this.emsRepository.createSchedule({
      sessionId: data.sessionId,
      templateId: data.templateId,
      subjectId: data.subjectId,
      date: new Date(data.date),
      startTime: new Date(`${data.date}T${data.startTime}`),
      endTime: new Date(`${data.date}T${data.endTime}`),
    });
  }

  async getSchedules() {
    return this.emsRepository.findAllSchedules();
  }

  async deleteSchedule(id: string) {
    return this.emsRepository.deleteSchedule(id);
  }

  // --- Exam Rooms ---
  async createRoom(scheduleId: string, data: CreateExamRoomDto) {
    return this.emsRepository.createRoom({ scheduleId, ...data });
  }

  async getRoomsForSchedule(scheduleId: string) {
    return this.emsRepository.findRoomsForSchedule(scheduleId);
  }

  async deleteRoom(id: string) {
    return this.emsRepository.deleteRoom(id);
  }

  // --- Seating ---
  private async getEnrolledStudentsForClass(classId: string) {
    const enrollments = await this.emsRepository.findEnrolledStudentsForClass(classId);
    return enrollments.map((e) => e.student);
  }

  async generateSeating(roomId: string, dto: GenerateSeatingDto) {
    const room = await this.emsRepository.findRoomById(roomId);
    if (!room) throw new NotFoundException("Exam room not found");

    const students = await this.getEnrolledStudentsForClass(dto.classId);
    if (students.length === 0) throw new BadRequestException("No enrolled students found for this class");

    const seatCount = Math.min(students.length, room.capacity);
    await this.emsRepository.deleteSeatingsForRoom(roomId);

    const rows = students.slice(0, seatCount).map((s, i) => ({
      roomId,
      studentId: s.id,
      seatNumber: `S${String(i + 1).padStart(3, "0")}`,
    }));

    await this.emsRepository.createSeatings(rows);
    return this.emsRepository.findSeatingsForRoom(roomId);
  }

  // --- Invigilators ---
  async createInvigilator(roomId: string, data: CreateInvigilatorDto) {
    return this.emsRepository.createInvigilator({ roomId, ...data });
  }

  async deleteInvigilator(id: string) {
    return this.emsRepository.deleteInvigilator(id);
  }

  // --- Question Banks ---
  async createQuestionBank(data: CreateEmsQuestionBankDto) {
    return this.emsRepository.createQuestionBank(data);
  }

  async getQuestionBanks() {
    return this.emsRepository.findAllQuestionBanks();
  }

  async deleteQuestionBank(id: string) {
    return this.emsRepository.deleteQuestionBank(id);
  }

  // --- Questions ---
  async createQuestion(questionBankId: string, data: CreateQuestionDto) {
    return this.emsRepository.createQuestion({ questionBankId, ...data, options: data.options as any });
  }

  async getQuestions(questionBankId: string) {
    return this.emsRepository.findQuestionsByBank(questionBankId);
  }

  async deleteQuestion(id: string) {
    return this.emsRepository.deleteQuestion(id);
  }

  // --- Question Papers ---
  async createQuestionPaper(data: CreateQuestionPaperDto) {
    return this.emsRepository.createQuestionPaper(data);
  }

  async getQuestionPapers() {
    return this.emsRepository.findAllQuestionPapers();
  }

  async getQuestionPaper(id: string) {
    const paper = await this.emsRepository.findQuestionPaperById(id);
    if (!paper) throw new NotFoundException("Question paper not found");
    return paper;
  }

  async addQuestionToPaper(questionPaperId: string, dto: AddQuestionPaperItemDto) {
    const [question] = await this.emsRepository.findQuestionsByIds([dto.questionId]);
    if (!question) throw new NotFoundException("Question not found");

    const sequence = (await this.emsRepository.countQuestionPaperItems(questionPaperId)) + 1;
    return this.emsRepository.addQuestionPaperItem({
      questionPaperId,
      questionId: dto.questionId,
      sequence,
      marks: dto.marks ?? question.marks,
    });
  }

  async approveQuestionPaper(id: string) {
    return this.emsRepository.approveQuestionPaper(id);
  }

  // --- Online Delivery Setup ---
  async activateOnlineSchedule(scheduleId: string, dto: ActivateOnlineScheduleDto) {
    const schedule = await this.emsRepository.findScheduleById(scheduleId);
    if (!schedule) throw new NotFoundException("Exam schedule not found");

    const paper = await this.emsRepository.findQuestionPaperById(dto.questionPaperId);
    if (!paper) throw new NotFoundException("Question paper not found");
    if (!paper.isApproved) throw new BadRequestException("Question paper must be approved before it can be scheduled online");
    if (paper.items.length === 0) throw new BadRequestException("Question paper has no questions");

    const invalidItem = paper.items.find(
      (item) => item.question.type !== "MCQ" || !item.question.options || !item.question.correctOptionId
    );
    if (invalidItem) {
      throw new BadRequestException(
        "Online tests currently support MCQ questions only — every question in the paper must have options and a correct answer set"
      );
    }

    return this.emsRepository.updateScheduleQuestionPaper(
      scheduleId,
      dto.questionPaperId,
      "ONLINE",
      dto.durationMin ?? paper.durationMin
    );
  }

  async getOnlineStatusForSchedule(scheduleId: string) {
    await this.sweepExpiredSubmissions();

    const [attempts, submissions] = await Promise.all([
      this.emsRepository.findAttemptsForSchedule(scheduleId),
      this.emsRepository.findSubmissionsForSchedule(scheduleId),
    ]);
    const byAttempt = new Map(submissions.map((s) => [s.attemptId, s]));

    return attempts.map((a) => {
      const submission = byAttempt.get(a.id);
      return {
        attemptId: a.id,
        student: a.student,
        status: submission?.status ?? "NOT_STARTED",
        startedAt: submission?.startedAt ?? null,
        submittedAt: submission?.submittedAt ?? null,
        autoSubmitted: submission?.autoSubmitted ?? false,
      };
    });
  }

  // --- Online Test Taking (student, via own or parent-mediated login) ---
  private async loadOwnedAttempt(attemptId: string, user: AuthenticatedUser) {
    const attempt = await this.emsRepository.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundException("Exam attempt not found");
    await this.ownershipService.assertOwnsStudent(user, attempt.studentId);
    return attempt;
  }

  async startOnlineAttempt(attemptId: string, user: AuthenticatedUser) {
    const attempt = await this.loadOwnedAttempt(attemptId, user);
    if (attempt.schedule.mode !== "ONLINE") throw new BadRequestException("This exam is not an online test");
    if (!attempt.schedule.questionPaperId) throw new BadRequestException("No question paper attached to this schedule");

    const existing = await this.emsRepository.findOnlineSubmissionByAttempt(attemptId);
    if (existing) {
      if (existing.status !== "IN_PROGRESS") {
        throw new BadRequestException("This test has already been submitted");
      }
      return existing;
    }

    const submission = await this.emsRepository.createOnlineSubmission({
      attemptId,
      scheduleId: attempt.scheduleId,
      startedAt: new Date(),
      status: "IN_PROGRESS",
    });
    await this.emsRepository.updateAttemptTiming(attemptId, submission.startedAt ?? undefined, undefined);
    return submission;
  }

  async getAttemptPaper(attemptId: string, user: AuthenticatedUser) {
    const attempt = await this.loadOwnedAttempt(attemptId, user);

    const submission = await this.emsRepository.findOnlineSubmissionByAttempt(attemptId);
    if (!submission) throw new BadRequestException("Start the test before requesting questions");
    if (await this.closeIfExpired(submission)) {
      throw new BadRequestException("Time is up — this test has been auto-submitted");
    }
    if (submission.status !== "IN_PROGRESS") throw new BadRequestException("This test is not in progress");

    const schedule = await this.emsRepository.findScheduleWithQuestionPaper(attempt.scheduleId);
    if (!schedule?.questionPaper) throw new NotFoundException("Question paper not found for this schedule");

    const answersByQuestion = new Map(submission.answers.map((a) => [a.questionId, a]));
    const deadline = new Date(submission.startedAt!.getTime() + (schedule.durationMin ?? 0) * 60000);

    return {
      submissionId: submission.id,
      startedAt: submission.startedAt,
      durationMin: schedule.durationMin,
      deadline,
      questions: schedule.questionPaper.items.map((item) => ({
        itemId: item.id,
        questionId: item.questionId,
        sequence: item.sequence,
        marks: item.marks,
        text: item.question.text,
        options: item.question.options,
        selectedOptionId: answersByQuestion.get(item.questionId)?.selectedOptionId ?? null,
      })),
    };
  }

  async saveAnswer(attemptId: string, dto: SaveAnswerDto, user: AuthenticatedUser) {
    const attempt = await this.loadOwnedAttempt(attemptId, user);

    const submission = await this.emsRepository.findOnlineSubmissionByAttempt(attemptId);
    if (!submission) throw new BadRequestException("Start the test before answering");
    if (await this.closeIfExpired(submission)) {
      throw new BadRequestException("Time is up — this test has been auto-submitted");
    }
    if (submission.status !== "IN_PROGRESS") throw new BadRequestException("This test is no longer accepting answers");

    return this.emsRepository.upsertAnswer(submission.id, dto.questionId, {
      submissionId: submission.id,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      textAnswer: dto.textAnswer,
    });
  }

  async submitOnlineAttempt(attemptId: string, user: AuthenticatedUser) {
    const attempt = await this.loadOwnedAttempt(attemptId, user);

    const submission = await this.emsRepository.findOnlineSubmissionByAttempt(attemptId);
    if (!submission) throw new BadRequestException("This test was never started");
    if (submission.status !== "IN_PROGRESS") throw new BadRequestException("This test has already been submitted");

    return this.gradeAndCloseSubmission(submission.id, false);
  }

  /** Returns true if the submission was expired and has just been auto-closed. */
  private async closeIfExpired(submission: { id: string; scheduleId: string; startedAt: Date | null; status: string }) {
    if (submission.status !== "IN_PROGRESS" || !submission.startedAt) return false;
    const schedule = await this.emsRepository.findScheduleById(submission.scheduleId);
    const deadline = new Date(submission.startedAt.getTime() + (schedule?.durationMin ?? 0) * 60000);
    if (new Date() <= deadline) return false;
    await this.gradeAndCloseSubmission(submission.id, true);
    return true;
  }

  /**
   * Touchpoint-based sweep for students who never reopen the app after time
   * expires (no dedicated cron in this codebase yet — see notes). Called
   * whenever a teacher opens the live monitor or a gradebook is computed, so
   * no expired attempt is missed before results/report cards are generated.
   */
  private async sweepExpiredSubmissions() {
    const inProgress = await this.emsRepository.findInProgressSubmissions();
    const now = Date.now();
    for (const submission of inProgress) {
      const deadline = (submission.startedAt?.getTime() ?? 0) + (submission.schedule.durationMin ?? 0) * 60000;
      if (now > deadline) {
        await this.gradeAndCloseSubmission(submission.id, true);
      }
    }
  }

  private async gradeAndCloseSubmission(submissionId: string, autoSubmitted: boolean) {
    const submission = await this.emsRepository.findOnlineSubmissionById(submissionId);
    if (!submission) throw new NotFoundException("Submission not found");

    const schedule = await this.emsRepository.findScheduleWithQuestionPaper(submission.scheduleId);
    const items = schedule?.questionPaper?.items ?? [];
    const answersByQuestion = new Map(submission.answers.map((a) => [a.questionId, a]));

    let totalAwarded = 0;
    for (const item of items) {
      const answer = answersByQuestion.get(item.questionId);
      const isCorrect = !!answer?.selectedOptionId && answer.selectedOptionId === item.question.correctOptionId;
      const marksAwarded = isCorrect ? item.marks : 0;
      totalAwarded += marksAwarded;
      await this.emsRepository.upsertAnswer(submissionId, item.questionId, {
        submissionId,
        questionId: item.questionId,
        selectedOptionId: answer?.selectedOptionId,
        textAnswer: answer?.textAnswer,
        isCorrect,
        marksAwarded,
      });
    }

    await this.emsRepository.updateOnlineSubmissionStatus(submissionId, {
      status: "GRADED",
      submittedAt: new Date(),
      autoSubmitted,
    });
    await this.emsRepository.updateAttemptTiming(submission.attemptId, undefined, new Date());

    // Same evaluation record offline exams use, so gradebook computation treats
    // online and offline marks identically.
    const systemGraderId = await this.emsRepository.getOrCreateSystemGraderId();
    await this.emsRepository.createEvaluation({
      attemptId: submission.attemptId,
      evaluatorId: systemGraderId,
      marksObtained: totalAwarded,
      remarks: autoSubmitted ? "Auto-graded (online MCQ, time expired)" : "Auto-graded (online MCQ)",
    });

    return { submissionId, totalAwarded, status: "GRADED", autoSubmitted };
  }

  // --- Exam Attempts ---
  async generateAttempts(scheduleId: string, dto: GenerateAttemptsDto) {
    const schedule = await this.emsRepository.findScheduleById(scheduleId);
    if (!schedule) throw new NotFoundException("Exam schedule not found");

    const students = await this.getEnrolledStudentsForClass(dto.classId);
    if (students.length === 0) throw new BadRequestException("No enrolled students found for this class");

    const existing = await this.emsRepository.findAttemptStudentIds(scheduleId, students.map((s) => s.id));
    const existingIds = new Set(existing.map((e) => e.studentId));
    const toCreate = students.filter((s) => !existingIds.has(s.id));

    if (toCreate.length > 0) {
      await this.emsRepository.createAttempts(
        toCreate.map((s) => ({ scheduleId, studentId: s.id, status: "PRESENT" }))
      );
    }

    return this.emsRepository.findAttemptsForSchedule(scheduleId);
  }

  async getAttempts(scheduleId: string) {
    return this.emsRepository.findAttemptsForScheduleWithEvaluations(scheduleId);
  }

  async updateAttemptStatus(id: string, status: string) {
    return this.emsRepository.updateAttemptStatus(id, status);
  }

  // --- Evaluation ---
  async createEvaluation(data: CreateEmsEvaluationDto) {
    return this.emsRepository.createEvaluation(data);
  }

  async getEvaluations() {
    return this.emsRepository.findAllEvaluations();
  }

  async updateEvaluation(id: string, data: UpdateEvaluationDto) {
    return this.emsRepository.updateEvaluation(id, data);
  }

  // --- Moderation ---
  async createModeration(scheduleId: string, data: CreateModerationDto) {
    return this.emsRepository.createModeration({ scheduleId, ...data });
  }

  async getModeration(scheduleId: string) {
    return this.emsRepository.findModerationForSchedule(scheduleId);
  }

  // --- Grading Schemes ---
  async createGradingScheme(data: CreateGradingSchemeDto) {
    return this.emsRepository.createGradingScheme({ ...data, ranges: data.ranges as any });
  }

  async getGradingSchemes() {
    return this.emsRepository.findAllGradingSchemes();
  }

  async deleteGradingScheme(id: string) {
    return this.emsRepository.deleteGradingScheme(id);
  }

  private resolveGrade(percentage: number, ranges: { min: number; max: number; grade: string }[]): string {
    const match = ranges.find((r) => percentage >= r.min && percentage <= r.max);
    return match?.grade || "N/A";
  }

  // --- Gradebook & Results ---
  async createGradebook(data: CreateEmsGradebookDto) {
    return this.emsRepository.createGradebook(data);
  }

  async getGradebooks() {
    return this.emsRepository.findAllGradebooks();
  }

  async computeResults(gradebookId: string, dto: ComputeResultsDto) {
    // Make sure any online test whose timer ran out (but was never reopened by
    // the student) is graded before we sum marks for the term.
    await this.sweepExpiredSubmissions();

    const gradebook = await this.emsRepository.findGradebookById(gradebookId);
    if (!gradebook) throw new NotFoundException("Gradebook not found");

    const students = await this.getEnrolledStudentsForClass(gradebook.classId);
    if (students.length === 0) throw new BadRequestException("No enrolled students found for this class");

    // Every schedule that belongs to this gradebook's EMS exam session contributes marks.
    const schedules = await this.emsRepository.findSchedulesBySession(gradebook.sessionId);
    const totalPossible = schedules.reduce((sum, s) => sum + s.template.totalMarks, 0);

    let scheme: { ranges: any } | null = null;
    if (dto.gradingSchemeId) {
      scheme = await this.emsRepository.findGradingSchemeById(dto.gradingSchemeId);
    }
    const ranges = (scheme?.ranges as { min: number; max: number; grade: string }[]) || [
      { min: 90, max: 100, grade: "A+" },
      { min: 80, max: 89.99, grade: "A" },
      { min: 70, max: 79.99, grade: "B+" },
      { min: 60, max: 69.99, grade: "B" },
      { min: 50, max: 59.99, grade: "C" },
      { min: 40, max: 49.99, grade: "D" },
      { min: 0, max: 39.99, grade: "F" },
    ];

    const scored = await Promise.all(
      students.map(async (student) => {
        const evaluations = await this.emsRepository.findEvaluationsForStudentSession(student.id, gradebook.sessionId);
        const totalMarks = evaluations.reduce((sum, e) => sum + e.marksObtained, 0);
        const percentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
        return { student, totalMarks, percentage };
      })
    );

    // Rank by percentage, descending.
    scored.sort((a, b) => b.percentage - a.percentage);

    const existingResults = await this.emsRepository.findResultsForGradebook(gradebookId);
    const existingByStudent = new Map(existingResults.map((r) => [r.studentId, r]));

    const results = await Promise.all(
      scored.map((s, index) => {
        const data = {
          totalMarks: s.totalMarks,
          percentage: s.percentage,
          grade: this.resolveGrade(s.percentage, ranges),
          rank: index + 1,
        };
        const existing = existingByStudent.get(s.student.id);
        if (existing) {
          return this.emsRepository.updateResult(existing.id, data);
        }
        return this.emsRepository.createResult({ gradebookId, studentId: s.student.id, ...data });
      })
    );

    return results;
  }

  async publishGradebook(id: string) {
    const gradebook = await this.emsRepository.publishGradebook(id);
    this.notifyParentsOfStudents(
      gradebook.results.map((r) => r.studentId),
      "Exam Results Published",
      "New exam results are available for your child.",
      { type: "EMS_RESULTS_PUBLISHED", gradebookId: id }
    ).catch((err) => console.error("Failed to notify parents of published results", err));
    return gradebook;
  }

  private async notifyParentsOfStudents(studentIds: string[], title: string, body: string, data: Record<string, any>) {
    if (studentIds.length === 0) return;
    const students = await this.emsRepository.findStudentsWithParents(studentIds);
    const parentIds = new Set<string>();
    for (const student of students) {
      for (const ps of student.parents) parentIds.add(ps.parentId);
    }
    if (parentIds.size === 0) return;
    const tokens = await this.notificationsService.getTokensForUsers(Array.from(parentIds), "PARENT");
    await this.notificationsService.sendPushNotifications(tokens, title, body, data);
  }

  // --- Report Cards ---
  async generateReportCard(data: GenerateEmsReportCardDto) {
    const results = await this.emsRepository.findResultsForReportCard(data.studentId, data.sessionId);
    const summary = results.length > 0
      ? `Grade: ${results[0].grade || "N/A"} · Percentage: ${results[0].percentage.toFixed(2)}% · Rank: ${results[0].rank ?? "N/A"}`
      : undefined;

    const reportCard = await this.emsRepository.createReportCard({
      studentId: data.studentId,
      sessionId: data.sessionId,
      fileUrl: data.fileUrl,
      remarks: data.remarks || summary,
      attendance: data.attendance,
    });

    this.notifyParentsOfStudents(
      [data.studentId],
      "Report Card Ready",
      `A new report card is available for ${reportCard.student.fullName}.`,
      { type: "EMS_REPORT_CARD", reportCardId: reportCard.id }
    ).catch((err) => console.error("Failed to notify parents of report card", err));

    return reportCard;
  }

  async getReportCards() {
    return this.emsRepository.findAllReportCards();
  }

  // ==========================================
  // MOBILE — "MY DATA" (parent/student & staff scoped views)
  // ==========================================

  async getStudentExams(studentId: string) {
    const attempts = await this.emsRepository.findAttemptsByStudent(studentId);

    const scheduleIds = attempts.map((a) => a.scheduleId);
    const seatings = scheduleIds.length
      ? await this.emsRepository.findSeatingsForStudentSchedules(studentId, scheduleIds)
      : [];
    const seatByScheduleId = new Map(seatings.map((s) => [s.room.scheduleId, s]));

    const submissions = attempts.length
      ? await this.emsRepository.findSubmissionsForAttempts(attempts.map((a) => a.id))
      : [];
    const submissionByAttempt = new Map(submissions.map((s) => [s.attemptId, s]));

    return attempts.map((a) => {
      const seat = seatByScheduleId.get(a.scheduleId);
      return {
        attemptId: a.id,
        scheduleId: a.scheduleId,
        status: a.status,
        subject: a.schedule.subject,
        template: a.schedule.template,
        date: a.schedule.date,
        startTime: a.schedule.startTime,
        endTime: a.schedule.endTime,
        mode: a.schedule.mode,
        durationMin: a.schedule.durationMin,
        onlineStatus: submissionByAttempt.get(a.id)?.status ?? null,
        marksObtained: a.evaluations[0]?.marksObtained ?? null,
        remarks: a.evaluations[0]?.remarks ?? null,
        seat: seat
          ? {
              seatNumber: seat.seatNumber,
              roomCapacity: seat.room.capacity,
              invigilators: seat.room.invigilators.map((iv) => iv.staff.fullName),
            }
          : null,
      };
    });
  }

  async getStudentResults(studentId: string) {
    const results = await this.emsRepository.findResultsForStudent(studentId);
    const reportCards = await this.emsRepository.findReportCardsForStudent(studentId);
    return { results, reportCards };
  }

  async getStaffInvigilations(staffId: string) {
    return this.emsRepository.findInvigilationsForStaff(staffId);
  }

  async getRoomAttendance(roomId: string) {
    const room = await this.emsRepository.findRoomWithSeatings(roomId);
    if (!room) throw new NotFoundException("Exam room not found");

    const studentIds = room.seatings.map((s) => s.studentId);
    const attempts = studentIds.length
      ? await this.emsRepository.findAttemptsByScheduleAndStudents(room.scheduleId, studentIds)
      : [];
    const attemptByStudent = new Map(attempts.map((a) => [a.studentId, a]));

    return room.seatings.map((s) => ({
      seatNumber: s.seatNumber,
      student: s.student,
      attempt: attemptByStudent.get(s.studentId) || null,
    }));
  }

  async getStaffEvaluationQueue(staffId: string) {
    const assignments = await this.emsRepository.findTeacherSubjectIds(staffId);
    const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId).filter((id): id is string => !!id)));
    if (subjectIds.length === 0) return { pending: [], graded: [] };

    const attempts = await this.emsRepository.findAttemptsForSubjects(subjectIds);

    return {
      pending: attempts.filter((a) => a.evaluations.length === 0),
      graded: attempts.filter((a) => a.evaluations.length > 0),
    };
  }
}
