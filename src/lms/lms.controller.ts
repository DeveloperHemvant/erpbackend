import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LmsService } from './lms.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateCurriculumDto,
  CreateUnitDto,
  CreateChapterDto,
  CreateTopicDto,
  CreateLessonDto,
  UploadResourceDto,
  CreateLmsAssignmentDto,
  CreateQuizDto,
  CreateLiveClassDto,
  LogAiGenerationDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  UpsertGradeDto,
  CreateDiscussionThreadDto,
  CreateDiscussionPostDto,
  AwardBadgeDto,
} from './dto/lms.dto';

// Class-level MANAGE_LMS is the default for every route (content authoring is
// staff-only); routes a student legitimately needs — viewing content, submitting
// work, participating in discussions — are individually reopened to VIEW_LMS
// below via the same self-or-any-permission override pattern used elsewhere
// (e.g. discipline.controller.ts). Previously this controller had NO decorators
// at all, which under the global PermissionsGuard's fallback (no requirement ->
// implicit literal "read"/"write" permission) meant every route was unreachable
// by any non-wildcard role, staff included — not just a naming mismatch.
@RequirePermissions('MANAGE_LMS')
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Post('courses')
  createCourse(@Body() data: CreateCourseDto) {
    return this.lmsService.createCourse(data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('courses')
  getCourses() {
    return this.lmsService.getCourses();
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.lmsService.getCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() data: UpdateCourseDto) {
    return this.lmsService.updateCourse(id, data);
  }

  @Post('curriculum')
  createCurriculum(@Body() data: CreateCurriculumDto) {
    return this.lmsService.createCurriculum(data);
  }

  @Post('units')
  createUnit(@Body() data: CreateUnitDto) {
    return this.lmsService.createUnit(data);
  }

  @Post('chapters')
  createChapter(@Body() data: CreateChapterDto) {
    return this.lmsService.createChapter(data);
  }

  @Post('topics')
  createTopic(@Body() data: CreateTopicDto) {
    return this.lmsService.createTopic(data);
  }

  @Post('lessons')
  createLesson(@Body() data: CreateLessonDto) {
    return this.lmsService.createLesson(data);
  }

  @Post('resources')
  uploadResource(@Body() data: UploadResourceDto) {
    return this.lmsService.uploadResource(data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('resources')
  getResources(@Query('classId') classId?: string) {
    return this.lmsService.getResources(classId);
  }

  // --- PHASE 2: ASSESSMENTS ---
  @Post('assignments')
  createAssignment(
    @Body() data: CreateLmsAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lmsService.createAssignment(user.userId, data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('assignments')
  getAssignments(
    @Query('courseId') courseId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.lmsService.getAssignments(courseId, classId, sectionId);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Post('assignments/:id/submit')
  submitAssignment(@Param('id') id: string, @Body() data: SubmitAssignmentDto) {
    return this.lmsService.submitAssignment({ ...data, assignmentId: id });
  }

  @Get('assignments/:id/submissions')
  getSubmissionsForAssignment(@Param('id') id: string) {
    return this.lmsService.getSubmissionsForAssignment(id);
  }

  @Patch('submissions/:id/grade')
  gradeSubmission(@Param('id') id: string, @Body() data: GradeSubmissionDto) {
    return this.lmsService.gradeSubmission(id, data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('gradebook/:courseId')
  getGradebook(@Param('courseId') courseId: string) {
    return this.lmsService.getGradebook(courseId);
  }

  @Post('gradebook/:courseId/grades')
  upsertGrade(
    @Param('courseId') courseId: string,
    @Body() data: UpsertGradeDto,
  ) {
    return this.lmsService.upsertGrade(courseId, data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('discussions')
  getDiscussionThreads(@Query('courseId') courseId: string) {
    return this.lmsService.getDiscussionThreads(courseId);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Post('discussions')
  createDiscussionThread(@Body() data: CreateDiscussionThreadDto) {
    return this.lmsService.createDiscussionThread(data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Post('discussions/:threadId/posts')
  createDiscussionPost(
    @Param('threadId') threadId: string,
    @Body() data: CreateDiscussionPostDto,
  ) {
    return this.lmsService.createDiscussionPost(threadId, data);
  }

  @Post('badges/award')
  awardBadge(@Body() data: AwardBadgeDto) {
    return this.lmsService.awardBadgeToStudent(data);
  }

  @Post('quizzes')
  createQuiz(@Body() data: CreateQuizDto) {
    return this.lmsService.createQuiz(data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('quizzes')
  getQuizzes() {
    return this.lmsService.getQuizzes();
  }

  // --- PHASE 3: LIVE CLASSES & AI ---
  @Post('live-classes')
  createLiveClass(@Body() data: CreateLiveClassDto) {
    return this.lmsService.createLiveClass(data);
  }

  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_LMS', 'MANAGE_LMS')
  @RequirePermissions()
  @Get('live-classes')
  getLiveClasses() {
    return this.lmsService.getLiveClasses();
  }

  @Post('ai-log')
  logAIGeneration(@Body() data: LogAiGenerationDto) {
    return this.lmsService.logAIGeneration(data);
  }
}
