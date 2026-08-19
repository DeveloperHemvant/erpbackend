import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from '../communication/communication.service';

@Injectable()
export class LmsService {
  constructor(
    private prisma: PrismaService,
    private readonly communicationService: CommunicationService,
  ) {}

  // --- COURSES ---
  async createCourse(data: any) {
    return this.prisma.lMSCourse.create({ data });
  }

  async getCourses() {
    return this.prisma.lMSCourse.findMany({
      include: {
        subject: true,
        class: true,
        curriculum: true,
        sections: { include: { teacher: true, section: true } },
      },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.lMSCourse.findUnique({
      where: { id },
      include: {
        subject: true,
        class: true,
        curriculum: {
          include: {
            units: {
              include: {
                chapters: {
                  include: {
                    topics: {
                      include: {
                        lessons: { include: { resources: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sections: { include: { teacher: true, section: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(id: string, data: any) {
    return this.prisma.lMSCourse.update({ where: { id }, data });
  }

  // --- CURRICULUM, UNITS, CHAPTERS, TOPICS, LESSONS ---
  async createCurriculum(data: any) {
    return this.prisma.lMSCurriculum.create({ data });
  }

  async createUnit(data: any) {
    return this.prisma.lMSUnit.create({ data });
  }

  async createChapter(data: any) {
    return this.prisma.lMSChapter.create({ data });
  }

  async createTopic(data: any) {
    return this.prisma.lMSTopic.create({ data });
  }

  async createLesson(data: any) {
    return this.prisma.lMSLesson.create({ data });
  }

  // --- DIGITAL LIBRARY ---
  async uploadResource(data: any) {
    return this.prisma.lMSContentResource.create({ data });
  }

  async getResources(classId?: string) {
    return this.prisma.lMSContentResource.findMany({
      where: classId
        ? {
            lesson: {
              topic: {
                chapter: { unit: { curriculum: { course: { classId } } } },
              },
            },
          }
        : undefined,
      include: {
        lesson: { include: { topic: { include: { chapter: true } } } },
      },
    });
  }

  // --- PHASE 2: ASSESSMENTS & GRADEBOOK ---
  async createAssignment(teacherId: string, data: any) {
    const assignment = await this.prisma.lMSAssignment.create({
      data: { ...data, teacherId },
    });

    if (assignment.sectionId) {
      this.notifyAssignmentCreated(assignment.sectionId, assignment.title).catch(
        (err) => console.error('Failed to notify homework created', err),
      );
    }

    return assignment;
  }

  /** Notifies students/families in the assignment's section — previously
   * creating homework triggered no notification of any kind. */
  private async notifyAssignmentCreated(sectionId: string, title: string) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { sectionId },
      select: { studentId: true },
    });
    const msg = `New homework "${title}" has been posted.`;
    for (const { studentId } of enrollments) {
      await this.communicationService.sendCustomAlert(
        studentId,
        'New Homework Assigned',
        msg,
        '/modules/student/homework',
      );
    }
  }

  async getAssignments(
    courseId?: string,
    classId?: string,
    sectionId?: string,
  ) {
    const where = sectionId
      ? { sectionId }
      : courseId
        ? {
            lesson: {
              topic: { chapter: { unit: { curriculum: { courseId } } } },
            },
          }
        : classId
          ? {
              lesson: {
                topic: {
                  chapter: { unit: { curriculum: { course: { classId } } } },
                },
              },
            }
          : undefined;
    return this.prisma.lMSAssignment.findMany({
      where,
      include: { submissions: true, teacher: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitAssignment(data: any) {
    return this.prisma.lMSSubmission.create({ data });
  }

  async getSubmissionsForAssignment(assignmentId: string) {
    return this.prisma.lMSSubmission.findMany({
      where: { assignmentId },
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(
    id: string,
    data: { score: number; feedback?: string },
  ) {
    const submission = await this.prisma.lMSSubmission.findUnique({
      where: { id },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return this.prisma.lMSSubmission.update({
      where: { id },
      data: {
        score: data.score,
        feedback: data.feedback,
        gradedAt: new Date(),
      },
    });
  }

  // --- GRADEBOOK ---
  async getGradebook(courseId: string) {
    const gradebook = await this.prisma.lMSGradebook.findUnique({
      where: { courseId },
      include: {
        grades: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });
    return gradebook || { courseId, grades: [] };
  }

  async upsertGrade(
    courseId: string,
    data: { studentId: string; totalScore: number; letterGrade?: string },
  ) {
    const gradebook = await this.prisma.lMSGradebook.upsert({
      where: { courseId },
      create: { courseId },
      update: {},
    });
    const existing = await this.prisma.lMSGrade.findFirst({
      where: { gradebookId: gradebook.id, studentId: data.studentId },
    });
    if (existing) {
      return this.prisma.lMSGrade.update({
        where: { id: existing.id },
        data: { totalScore: data.totalScore, letterGrade: data.letterGrade },
      });
    }
    return this.prisma.lMSGrade.create({
      data: {
        gradebookId: gradebook.id,
        studentId: data.studentId,
        totalScore: data.totalScore,
        letterGrade: data.letterGrade,
      },
    });
  }

  // --- DISCUSSIONS ---
  async getDiscussionThreads(courseId: string) {
    return this.prisma.lMSDiscussionThread.findMany({
      where: { courseId },
      include: { posts: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDiscussionThread(data: {
    courseId: string;
    title: string;
    authorId?: string;
  }) {
    return this.prisma.lMSDiscussionThread.create({ data });
  }

  async createDiscussionPost(
    threadId: string,
    data: { content: string; authorId?: string },
  ) {
    const thread = await this.prisma.lMSDiscussionThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException('Discussion thread not found');
    return this.prisma.lMSDiscussionPost.create({
      data: { ...data, threadId },
    });
  }

  async createQuiz(data: any) {
    return this.prisma.lMSQuiz.create({ data });
  }

  async getQuizzes() {
    return this.prisma.lMSQuiz.findMany({ include: { attempts: true } });
  }

  // --- PHASE 3: LIVE CLASSES & GAMIFICATION ---
  async createLiveClass(data: any) {
    return this.prisma.lMSLiveClass.create({ data });
  }

  async getLiveClasses() {
    return this.prisma.lMSLiveClass.findMany({
      include: { course: true, host: true },
    });
  }

  async awardBadge(data: any) {
    return this.prisma.lMSBadge.create({ data });
  }

  async awardBadgeToStudent(data: {
    studentId: string;
    name: string;
    iconUrl?: string;
  }) {
    const portfolio = await this.prisma.lMSStudentPortfolio.upsert({
      where: { studentId: data.studentId },
      create: { studentId: data.studentId },
      update: {},
    });
    return this.prisma.lMSBadge.create({
      data: {
        portfolioId: portfolio.id,
        name: data.name,
        iconUrl: data.iconUrl,
      },
    });
  }

  async logAIGeneration(data: any) {
    return this.prisma.lMSAIGeneration.create({ data });
  }
}
