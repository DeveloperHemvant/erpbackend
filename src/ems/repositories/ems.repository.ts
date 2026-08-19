import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveSystemAccountCampusId } from '../../common/utils/campus-resolution';

const SYSTEM_GRADER_EMAIL = 'system.grader@internal.ems';

@Injectable()
export class EmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Exam Sessions ---
  createSession(data: Prisma.EMSExamSessionUncheckedCreateInput) {
    return this.prisma.eMSExamSession.create({ data });
  }

  findAllSessions() {
    return this.prisma.eMSExamSession.findMany({
      include: { schedules: true },
    });
  }

  findSessionById(id: string) {
    return this.prisma.eMSExamSession.findUnique({ where: { id } });
  }

  deleteSession(id: string) {
    return this.prisma.eMSExamSession.delete({ where: { id } });
  }

  // --- Exam Types ---
  createType(data: Prisma.EMSExamTypeUncheckedCreateInput) {
    return this.prisma.eMSExamType.create({ data });
  }

  findAllTypes() {
    return this.prisma.eMSExamType.findMany({ include: { templates: true } });
  }

  deleteType(id: string) {
    return this.prisma.eMSExamType.delete({ where: { id } });
  }

  // --- Exam Templates ---
  createTemplate(data: Prisma.EMSExamTemplateUncheckedCreateInput) {
    return this.prisma.eMSExamTemplate.create({ data });
  }

  findAllTemplates() {
    return this.prisma.eMSExamTemplate.findMany({
      include: { type: true, schedules: true },
    });
  }

  deleteTemplate(id: string) {
    return this.prisma.eMSExamTemplate.delete({ where: { id } });
  }

  // --- Exam Schedules ---
  createSchedule(data: Prisma.EMSExamScheduleUncheckedCreateInput) {
    return this.prisma.eMSExamSchedule.create({
      data,
      include: { subject: true, template: { include: { type: true } } },
    });
  }

  // Resolve who to notify when a new exam schedule is created — the schedule
  // itself only carries sessionId+subjectId, so the teachers and enrolled
  // students/families are found via TeacherAssignment (sessionId+subjectId
  // -> staffId+sectionId) then StudentEnrollment (sectionId+sessionId).
  async findRecipientsForSubjectSchedule(sessionId: string, subjectId: string) {
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { sessionId, subjectId, status: 'Active' },
      select: { staffId: true, sectionId: true },
    });
    const staffIds = [...new Set(assignments.map((a) => a.staffId))];
    const sectionIds = [
      ...new Set(
        assignments
          .map((a) => a.sectionId)
          .filter((s): s is string => Boolean(s)),
      ),
    ];

    const enrollments = sectionIds.length
      ? await this.prisma.studentEnrollment.findMany({
          where: { sectionId: { in: sectionIds }, sessionId },
          select: { studentId: true },
        })
      : [];
    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    return { staffIds, studentIds };
  }

  findAllSchedules() {
    return this.prisma.eMSExamSchedule.findMany({
      include: {
        subject: true,
        template: { include: { type: true } },
        rooms: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  findScheduleById(id: string) {
    return this.prisma.eMSExamSchedule.findUnique({ where: { id } });
  }

  findScheduleWithQuestionPaper(id: string) {
    return this.prisma.eMSExamSchedule.findUnique({
      where: { id },
      include: {
        questionPaper: {
          include: {
            items: {
              include: { question: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });
  }

  findSchedulesBySession(sessionId: string) {
    return this.prisma.eMSExamSchedule.findMany({
      where: { sessionId },
      include: { template: true },
    });
  }

  updateScheduleQuestionPaper(
    id: string,
    questionPaperId: string,
    mode: string,
    durationMin: number,
  ) {
    return this.prisma.eMSExamSchedule.update({
      where: { id },
      data: { questionPaperId, mode, durationMin },
    });
  }

  deleteSchedule(id: string) {
    return this.prisma.eMSExamSchedule.delete({ where: { id } });
  }

  // --- Exam Rooms ---
  createRoom(data: Prisma.EMSExamRoomUncheckedCreateInput) {
    return this.prisma.eMSExamRoom.create({ data });
  }

  findRoomById(id: string) {
    return this.prisma.eMSExamRoom.findUnique({ where: { id } });
  }

  findRoomWithSeatings(id: string) {
    return this.prisma.eMSExamRoom.findUnique({
      where: { id },
      include: { seatings: { include: { student: true } } },
    });
  }

  findRoomsForSchedule(scheduleId: string) {
    return this.prisma.eMSExamRoom.findMany({
      where: { scheduleId },
      include: {
        seatings: { include: { student: true } },
        invigilators: { include: { staff: true } },
      },
    });
  }

  deleteRoom(id: string) {
    return this.prisma.eMSExamRoom.delete({ where: { id } });
  }

  // --- Enrolled students helper ---
  findEnrolledStudentsForClass(classId: string) {
    return this.prisma.studentEnrollment.findMany({
      where: { section: { classId }, status: 'Enrolled' },
      include: { student: true },
      orderBy: { rollNumber: 'asc' },
    });
  }

  // --- Seating ---
  deleteSeatingsForRoom(roomId: string) {
    return this.prisma.eMSExamSeating.deleteMany({ where: { roomId } });
  }

  createSeatings(rows: Prisma.EMSExamSeatingCreateManyInput[]) {
    return this.prisma.eMSExamSeating.createMany({ data: rows });
  }

  findSeatingsForRoom(roomId: string) {
    return this.prisma.eMSExamSeating.findMany({
      where: { roomId },
      include: { student: true },
    });
  }

  findSeatingsForStudentSchedules(studentId: string, scheduleIds: string[]) {
    return this.prisma.eMSExamSeating.findMany({
      where: { studentId, room: { scheduleId: { in: scheduleIds } } },
      include: {
        room: { include: { invigilators: { include: { staff: true } } } },
      },
    });
  }

  findSeatingsForStudentInSession(studentId: string, sessionId: string) {
    return this.prisma.eMSExamSeating.findMany({
      where: { studentId, room: { schedule: { sessionId } } },
      include: {
        room: {
          include: {
            schedule: { include: { subject: true } },
          },
        },
      },
    });
  }

  findMasterRoomsByIds(roomIds: string[]) {
    return this.prisma.room.findMany({ where: { id: { in: roomIds } } });
  }

  findStudentForHallTicket(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'Enrolled' },
          include: { section: { include: { class: true } } },
          take: 1,
        },
      },
    });
  }

  // --- Invigilators ---
  createInvigilator(data: Prisma.EMSInvigilatorUncheckedCreateInput) {
    return this.prisma.eMSInvigilator.create({
      data,
      include: { staff: true },
    });
  }

  deleteInvigilator(id: string) {
    return this.prisma.eMSInvigilator.delete({ where: { id } });
  }

  findInvigilationsForStaff(staffId: string) {
    return this.prisma.eMSInvigilator.findMany({
      where: { staffId },
      include: {
        room: {
          include: {
            schedule: { include: { subject: true, template: true } },
            seatings: true,
          },
        },
      },
      orderBy: { room: { schedule: { date: 'asc' } } },
    });
  }

  // --- Question Banks ---
  createQuestionBank(data: Prisma.EMSQuestionBankUncheckedCreateInput) {
    return this.prisma.eMSQuestionBank.create({ data });
  }

  findAllQuestionBanks() {
    return this.prisma.eMSQuestionBank.findMany({
      include: { questions: true, subject: true },
    });
  }

  deleteQuestionBank(id: string) {
    return this.prisma.eMSQuestionBank.delete({ where: { id } });
  }

  // --- Questions ---
  createQuestion(data: Prisma.EMSQuestionUncheckedCreateInput) {
    return this.prisma.eMSQuestion.create({ data });
  }

  findQuestionsByBank(questionBankId: string) {
    return this.prisma.eMSQuestion.findMany({
      where: { questionBankId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findQuestionsByIds(ids: string[]) {
    return this.prisma.eMSQuestion.findMany({ where: { id: { in: ids } } });
  }

  deleteQuestion(id: string) {
    return this.prisma.eMSQuestion.delete({ where: { id } });
  }

  // --- Question Papers ---
  createQuestionPaper(data: Prisma.EMSQuestionPaperUncheckedCreateInput) {
    return this.prisma.eMSQuestionPaper.create({ data });
  }

  findAllQuestionPapers() {
    return this.prisma.eMSQuestionPaper.findMany({
      include: {
        subject: true,
        items: { include: { question: true }, orderBy: { sequence: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findQuestionPaperById(id: string) {
    return this.prisma.eMSQuestionPaper.findUnique({
      where: { id },
      include: {
        items: { include: { question: true }, orderBy: { sequence: 'asc' } },
      },
    });
  }

  approveQuestionPaper(id: string) {
    return this.prisma.eMSQuestionPaper.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  addQuestionPaperItem(data: Prisma.EMSQuestionPaperItemUncheckedCreateInput) {
    return this.prisma.eMSQuestionPaperItem.create({ data });
  }

  countQuestionPaperItems(questionPaperId: string) {
    return this.prisma.eMSQuestionPaperItem.count({
      where: { questionPaperId },
    });
  }

  // --- Exam Attempts ---
  findAttemptStudentIds(scheduleId: string, studentIds: string[]) {
    return this.prisma.eMSExamAttempt.findMany({
      where: { scheduleId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
  }

  createAttempts(rows: Prisma.EMSExamAttemptCreateManyInput[]) {
    return this.prisma.eMSExamAttempt.createMany({ data: rows });
  }

  findAttemptsForSchedule(scheduleId: string) {
    return this.prisma.eMSExamAttempt.findMany({
      where: { scheduleId },
      include: { student: true },
    });
  }

  findAttemptsForScheduleWithEvaluations(scheduleId: string) {
    return this.prisma.eMSExamAttempt.findMany({
      where: { scheduleId },
      include: { student: true, evaluations: true },
    });
  }

  findAttemptById(id: string) {
    return this.prisma.eMSExamAttempt.findUnique({
      where: { id },
      include: { schedule: true, student: true },
    });
  }

  findAttemptForStudentSchedule(scheduleId: string, studentId: string) {
    return this.prisma.eMSExamAttempt.findFirst({
      where: { scheduleId, studentId },
    });
  }

  updateAttemptStatus(id: string, status: string) {
    return this.prisma.eMSExamAttempt.update({
      where: { id },
      data: { status },
    });
  }

  updateAttemptTiming(id: string, startedAt?: Date, endedAt?: Date) {
    return this.prisma.eMSExamAttempt.update({
      where: { id },
      data: { startedAt, endedAt },
    });
  }

  findAttemptsByStudent(studentId: string) {
    return this.prisma.eMSExamAttempt.findMany({
      where: { studentId },
      include: {
        schedule: {
          include: {
            subject: true,
            template: { include: { type: true } },
            session: true,
          },
        },
        evaluations: true,
      },
      orderBy: { schedule: { date: 'asc' } },
    });
  }

  findAttemptsByScheduleAndStudents(scheduleId: string, studentIds: string[]) {
    return this.prisma.eMSExamAttempt.findMany({
      where: { scheduleId, studentId: { in: studentIds } },
    });
  }

  findAttemptsForSubjects(subjectIds: string[]) {
    return this.prisma.eMSExamAttempt.findMany({
      where: {
        schedule: { subjectId: { in: subjectIds } },
        status: { not: 'ABSENT' },
      },
      include: {
        student: true,
        schedule: { include: { subject: true, template: true } },
        evaluations: true,
      },
      orderBy: { schedule: { date: 'desc' } },
    });
  }

  // --- Online Submissions & Answers ---
  createOnlineSubmission(data: Prisma.EMSOnlineSubmissionUncheckedCreateInput) {
    return this.prisma.eMSOnlineSubmission.create({ data });
  }

  findOnlineSubmissionByAttempt(attemptId: string) {
    return this.prisma.eMSOnlineSubmission.findUnique({
      where: { attemptId },
      include: { answers: true },
    });
  }

  findOnlineSubmissionById(id: string) {
    return this.prisma.eMSOnlineSubmission.findUnique({
      where: { id },
      include: {
        answers: true,
        attempt: { include: { student: true } },
        schedule: true,
      },
    });
  }

  updateOnlineSubmissionStatus(
    id: string,
    data: Prisma.EMSOnlineSubmissionUncheckedUpdateInput,
  ) {
    return this.prisma.eMSOnlineSubmission.update({ where: { id }, data });
  }

  findInProgressSubmissions() {
    return this.prisma.eMSOnlineSubmission.findMany({
      where: { status: 'IN_PROGRESS' },
      include: { schedule: true, answers: true },
    });
  }

  findSubmissionsForSchedule(scheduleId: string) {
    return this.prisma.eMSOnlineSubmission.findMany({ where: { scheduleId } });
  }

  findSubmissionsForAttempts(attemptIds: string[]) {
    return this.prisma.eMSOnlineSubmission.findMany({
      where: { attemptId: { in: attemptIds } },
    });
  }

  upsertAnswer(
    submissionId: string,
    questionId: string,
    data: Prisma.EMSAnswerUncheckedCreateInput,
  ) {
    return this.prisma.eMSAnswer.upsert({
      where: { submissionId_questionId: { submissionId, questionId } },
      update: data,
      create: data,
    });
  }

  findAnswersForSubmission(submissionId: string) {
    return this.prisma.eMSAnswer.findMany({
      where: { submissionId },
      include: { question: true },
    });
  }

  // --- Evaluation ---
  createEvaluation(data: Prisma.EMSEvaluationRecordUncheckedCreateInput) {
    return this.prisma.eMSEvaluationRecord.create({
      data,
      include: { attempt: { include: { student: true } } },
    });
  }

  findAllEvaluations() {
    return this.prisma.eMSEvaluationRecord.findMany({
      include: {
        attempt: { include: { student: true, schedule: true } },
        evaluator: true,
      },
    });
  }

  findEvaluationsForAttempt(attemptId: string) {
    return this.prisma.eMSEvaluationRecord.findMany({ where: { attemptId } });
  }

  updateEvaluation(
    id: string,
    data: Prisma.EMSEvaluationRecordUncheckedUpdateInput,
  ) {
    return this.prisma.eMSEvaluationRecord.update({ where: { id }, data });
  }

  findEvaluationsForStudentSession(studentId: string, sessionId: string) {
    return this.prisma.eMSEvaluationRecord.findMany({
      where: { attempt: { studentId, schedule: { sessionId } } },
    });
  }

  // --- Moderation ---
  createModeration(data: Prisma.EMSModerationRecordUncheckedCreateInput) {
    return this.prisma.eMSModerationRecord.create({
      data,
      include: { moderator: true },
    });
  }

  findModerationForSchedule(scheduleId: string) {
    return this.prisma.eMSModerationRecord.findMany({
      where: { scheduleId },
      include: { moderator: true },
    });
  }

  // --- Grading Schemes ---
  createGradingScheme(data: Prisma.EMSGradingSchemeUncheckedCreateInput) {
    return this.prisma.eMSGradingScheme.create({ data });
  }

  findAllGradingSchemes() {
    return this.prisma.eMSGradingScheme.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findGradingSchemeById(id: string) {
    return this.prisma.eMSGradingScheme.findUnique({ where: { id } });
  }

  deleteGradingScheme(id: string) {
    return this.prisma.eMSGradingScheme.delete({ where: { id } });
  }

  // --- Gradebook & Results ---
  createGradebook(data: Prisma.EMSGradebookUncheckedCreateInput) {
    return this.prisma.eMSGradebook.create({ data });
  }

  findAllGradebooks() {
    return this.prisma.eMSGradebook.findMany({
      include: {
        session: true,
        class: true,
        results: { include: { student: true } },
      },
    });
  }

  findGradebookById(id: string) {
    return this.prisma.eMSGradebook.findUnique({ where: { id } });
  }

  findResultsForGradebook(gradebookId: string) {
    return this.prisma.eMSResult.findMany({ where: { gradebookId } });
  }

  createResult(data: Prisma.EMSResultUncheckedCreateInput) {
    return this.prisma.eMSResult.create({ data });
  }

  updateResult(id: string, data: Prisma.EMSResultUncheckedUpdateInput) {
    return this.prisma.eMSResult.update({ where: { id }, data });
  }

  publishGradebook(id: string) {
    return this.prisma.eMSGradebook.update({
      where: { id },
      data: { isPublished: true },
      include: { results: true },
    });
  }

  findResultsForStudent(studentId: string) {
    return this.prisma.eMSResult.findMany({
      where: { studentId },
      include: { gradebook: { include: { session: true, class: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Report Cards ---
  findResultsForReportCard(studentId: string, sessionId: string) {
    return this.prisma.eMSResult.findMany({
      where: { student: { id: studentId }, gradebook: { sessionId } },
    });
  }

  createReportCard(data: Prisma.EMSReportCardUncheckedCreateInput) {
    return this.prisma.eMSReportCard.create({
      data,
      include: { student: true, session: true },
    });
  }

  findAllReportCards() {
    return this.prisma.eMSReportCard.findMany({
      include: { student: true, session: true },
    });
  }

  findReportCardsForStudent(studentId: string) {
    return this.prisma.eMSReportCard.findMany({
      where: { studentId },
      include: { session: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  // --- Auto-grading identity ---
  // MCQ answers are graded by the system, not a human evaluator, but
  // EMSEvaluationRecord.evaluatorId is a required FK to Staff. Rather than
  // loosen that constraint (a schema change), we lazily create one inert,
  // non-login Staff row the first time it's needed and reuse it forever.
  async getOrCreateSystemGraderId(): Promise<string> {
    const existing = await this.prisma.staff.findUnique({
      where: { email: SYSTEM_GRADER_EMAIL },
    });
    if (existing) return existing.id;

    let role = await this.prisma.role.findFirst({ where: { name: 'System' } });
    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: 'System',
          description: 'Internal automation identity — cannot log in',
          permissions: [],
        },
      });
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    const campusId = await resolveSystemAccountCampusId(this.prisma);
    const created = await this.prisma.staff.create({
      data: {
        email: SYSTEM_GRADER_EMAIL,
        passwordHash,
        fullName: 'Auto-Grader (System)',
        roleId: role.id,
        status: 'Inactive',
        campusId,
      },
    });
    return created.id;
  }

  // --- Staff assignments / notifications helpers ---
  findTeacherSubjectIds(staffId: string) {
    return this.prisma.teacherAssignment.findMany({
      where: { staffId, subjectId: { not: null } },
      select: { subjectId: true },
    });
  }

  findStudentsWithParents(studentIds: string[]) {
    return this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { parents: true },
    });
  }
}
