import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmsService } from './ems.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireSelfAccess } from '../auth/self-access.decorator';
import { RequireStudentAccess } from '../auth/student-access.decorator';
import { StudentAccessGuard } from '../auth/student-access.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
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
} from './dto/ems.dto';

// Every route below manages exam setup/grading data (school-wide, not a single
// user's own record), so it requires MANAGE_EXAMS regardless of HTTP verb —
// the PermissionsGuard default (read/write) would otherwise let any portal
// account with a blanket "read" permission (e.g. Student/Parent) list every
// question bank, schedule, and evaluation in the school.
@RequirePermissions('MANAGE_EXAMS')
@Controller('ems')
export class EmsController {
  constructor(private readonly emsService: EmsService) {}

  // --- Exam Sessions ---
  @Post('sessions')
  createSession(@Body() data: CreateEmsSessionDto) {
    return this.emsService.createSession(data);
  }

  @Get('sessions')
  getSessions() {
    return this.emsService.getSessions();
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string) {
    return this.emsService.deleteSession(id);
  }

  // --- Exam Types ---
  @Post('types')
  createType(@Body() data: CreateEmsExamTypeDto) {
    return this.emsService.createType(data);
  }

  @Get('types')
  getTypes() {
    return this.emsService.getTypes();
  }

  @Delete('types/:id')
  deleteType(@Param('id') id: string) {
    return this.emsService.deleteType(id);
  }

  // --- Exam Templates ---
  @Post('templates')
  createTemplate(@Body() data: CreateEmsExamTemplateDto) {
    return this.emsService.createTemplate(data);
  }

  @Get('templates')
  getTemplates() {
    return this.emsService.getTemplates();
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.emsService.deleteTemplate(id);
  }

  // --- Exam Schedules (Timetable & Seating) ---
  @Post('schedules')
  createSchedule(@Body() data: CreateExamScheduleDto) {
    return this.emsService.createSchedule(data);
  }

  @Get('schedules')
  getSchedules() {
    return this.emsService.getSchedules();
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string) {
    return this.emsService.deleteSchedule(id);
  }

  // --- Exam Rooms ---
  @Post('schedules/:scheduleId/rooms')
  createRoom(
    @Param('scheduleId') scheduleId: string,
    @Body() data: CreateExamRoomDto,
  ) {
    return this.emsService.createRoom(scheduleId, data);
  }

  @Get('schedules/:scheduleId/rooms')
  getRoomsForSchedule(@Param('scheduleId') scheduleId: string) {
    return this.emsService.getRoomsForSchedule(scheduleId);
  }

  @Delete('rooms/:id')
  deleteRoom(@Param('id') id: string) {
    return this.emsService.deleteRoom(id);
  }

  // --- Seating ---
  @Post('rooms/:roomId/seating/generate')
  generateSeating(
    @Param('roomId') roomId: string,
    @Body() data: GenerateSeatingDto,
  ) {
    return this.emsService.generateSeating(roomId, data);
  }

  // --- Invigilators ---
  @Post('rooms/:roomId/invigilators')
  createInvigilator(
    @Param('roomId') roomId: string,
    @Body() data: CreateInvigilatorDto,
  ) {
    return this.emsService.createInvigilator(roomId, data);
  }

  @Delete('invigilators/:id')
  deleteInvigilator(@Param('id') id: string) {
    return this.emsService.deleteInvigilator(id);
  }

  // --- Question Banks ---
  @Post('question-banks')
  createQuestionBank(@Body() data: CreateEmsQuestionBankDto) {
    return this.emsService.createQuestionBank(data);
  }

  @Get('question-banks')
  getQuestionBanks() {
    return this.emsService.getQuestionBanks();
  }

  @Delete('question-banks/:id')
  deleteQuestionBank(@Param('id') id: string) {
    return this.emsService.deleteQuestionBank(id);
  }

  // --- Questions ---
  @Post('question-banks/:questionBankId/questions')
  createQuestion(
    @Param('questionBankId') questionBankId: string,
    @Body() data: CreateQuestionDto,
  ) {
    return this.emsService.createQuestion(questionBankId, data);
  }

  @Get('question-banks/:questionBankId/questions')
  getQuestions(@Param('questionBankId') questionBankId: string) {
    return this.emsService.getQuestions(questionBankId);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.emsService.deleteQuestion(id);
  }

  // --- Question Papers ---
  @Post('question-papers')
  createQuestionPaper(@Body() data: CreateQuestionPaperDto) {
    return this.emsService.createQuestionPaper(data);
  }

  @Get('question-papers')
  getQuestionPapers() {
    return this.emsService.getQuestionPapers();
  }

  @Get('question-papers/:id')
  getQuestionPaper(@Param('id') id: string) {
    return this.emsService.getQuestionPaper(id);
  }

  @Post('question-papers/:id/questions')
  addQuestionToPaper(
    @Param('id') id: string,
    @Body() data: AddQuestionPaperItemDto,
  ) {
    return this.emsService.addQuestionToPaper(id, data);
  }

  @Patch('question-papers/:id/approve')
  approveQuestionPaper(@Param('id') id: string) {
    return this.emsService.approveQuestionPaper(id);
  }

  // --- Online Delivery Setup (teacher/admin) ---
  @Patch('schedules/:id/online')
  activateOnlineSchedule(
    @Param('id') id: string,
    @Body() data: ActivateOnlineScheduleDto,
  ) {
    return this.emsService.activateOnlineSchedule(id, data);
  }

  @Get('schedules/:id/online-status')
  getOnlineStatusForSchedule(@Param('id') id: string) {
    return this.emsService.getOnlineStatusForSchedule(id);
  }

  // --- Online Test Taking (student's own attempt, via own or parent-mediated login) ---
  @Post('attempts/:attemptId/start')
  @RequirePermissions()
  startOnlineAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emsService.startOnlineAttempt(attemptId, user);
  }

  @Get('attempts/:attemptId/paper')
  @RequirePermissions()
  getAttemptPaper(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emsService.getAttemptPaper(attemptId, user);
  }

  @Post('attempts/:attemptId/answers')
  @RequirePermissions()
  saveAnswer(
    @Param('attemptId') attemptId: string,
    @Body() data: SaveAnswerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emsService.saveAnswer(attemptId, data, user);
  }

  @Post('attempts/:attemptId/submit')
  @RequirePermissions()
  submitOnlineAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emsService.submitOnlineAttempt(attemptId, user);
  }

  // --- Exam Attempts ---
  @Post('schedules/:scheduleId/attempts/generate')
  generateAttempts(
    @Param('scheduleId') scheduleId: string,
    @Body() data: GenerateAttemptsDto,
  ) {
    return this.emsService.generateAttempts(scheduleId, data);
  }

  @Get('schedules/:scheduleId/attempts')
  getAttempts(@Param('scheduleId') scheduleId: string) {
    return this.emsService.getAttempts(scheduleId);
  }

  @Patch('attempts/:id/status')
  updateAttemptStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.emsService.updateAttemptStatus(id, status);
  }

  // --- Evaluation ---
  @Post('evaluations')
  createEvaluation(@Body() data: CreateEmsEvaluationDto) {
    return this.emsService.createEvaluation(data);
  }

  @Get('evaluations')
  getEvaluations() {
    return this.emsService.getEvaluations();
  }

  @Patch('evaluations/:id')
  updateEvaluation(@Param('id') id: string, @Body() data: UpdateEvaluationDto) {
    return this.emsService.updateEvaluation(id, data);
  }

  // --- Moderation ---
  @Post('schedules/:scheduleId/moderation')
  createModeration(
    @Param('scheduleId') scheduleId: string,
    @Body() data: CreateModerationDto,
  ) {
    return this.emsService.createModeration(scheduleId, data);
  }

  @Get('schedules/:scheduleId/moderation')
  getModeration(@Param('scheduleId') scheduleId: string) {
    return this.emsService.getModeration(scheduleId);
  }

  // --- Grading Schemes ---
  @Post('grading-schemes')
  createGradingScheme(@Body() data: CreateGradingSchemeDto) {
    return this.emsService.createGradingScheme(data);
  }

  @Get('grading-schemes')
  getGradingSchemes() {
    return this.emsService.getGradingSchemes();
  }

  @Delete('grading-schemes/:id')
  deleteGradingScheme(@Param('id') id: string) {
    return this.emsService.deleteGradingScheme(id);
  }

  // --- Gradebook & Results ---
  @Post('gradebooks')
  createGradebook(@Body() data: CreateEmsGradebookDto) {
    return this.emsService.createGradebook(data);
  }

  @Get('gradebooks')
  getGradebooks() {
    return this.emsService.getGradebooks();
  }

  @Post('gradebooks/:id/compute-results')
  computeResults(@Param('id') id: string, @Body() data: ComputeResultsDto) {
    return this.emsService.computeResults(id, data);
  }

  @Patch('gradebooks/:id/publish')
  publishGradebook(@Param('id') id: string) {
    return this.emsService.publishGradebook(id);
  }

  // --- Report Cards ---
  @Post('report-cards')
  generateReportCard(@Body() data: GenerateEmsReportCardDto) {
    return this.emsService.generateReportCard(data);
  }

  @Get('report-cards')
  getReportCards() {
    return this.emsService.getReportCards();
  }

  // --- Mobile: "My Data" ---
  // These are the student's/parent's/staff's own records, so they override the
  // controller-level MANAGE_EXAMS requirement and are scoped by ownership instead.

  @Get('students/:studentId/exams')
  @RequirePermissions()
  @UseGuards(StudentAccessGuard)
  @RequireStudentAccess('studentId')
  getStudentExams(@Param('studentId') studentId: string) {
    return this.emsService.getStudentExams(studentId);
  }

  @Get('students/:studentId/results')
  @RequirePermissions()
  @UseGuards(StudentAccessGuard)
  @RequireStudentAccess('studentId')
  getStudentResults(@Param('studentId') studentId: string) {
    return this.emsService.getStudentResults(studentId);
  }

  @Get('staff/:staffId/invigilations')
  @RequirePermissions()
  @RequireSelfAccess('staffId')
  getStaffInvigilations(@Param('staffId') staffId: string) {
    return this.emsService.getStaffInvigilations(staffId);
  }

  @Get('staff/:staffId/evaluation-queue')
  @RequirePermissions()
  @RequireSelfAccess('staffId')
  getStaffEvaluationQueue(@Param('staffId') staffId: string) {
    return this.emsService.getStaffEvaluationQueue(staffId);
  }

  @Get('rooms/:roomId/attendance')
  getRoomAttendance(@Param('roomId') roomId: string) {
    return this.emsService.getRoomAttendance(roomId);
  }
}
