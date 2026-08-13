import { Injectable, NotFoundException } from '@nestjs/common';
import { SubstitutionRepository } from './repositories/substitution.repository';
import { CreateSubstitutionDto } from './dto/substitution.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunicationService } from '../communication/communication.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubstitutionService {
  constructor(
    private readonly repository: SubstitutionRepository,
    private readonly notificationsService: NotificationsService,
    private readonly commService: CommunicationService,
    private readonly prisma: PrismaService,
  ) {}

  async createSubstitution(dto: CreateSubstitutionDto) {
    const sub = await this.repository.createSubstitution({
      leaveApplicationId: dto.leaveApplicationId,
      primaryTeacherId: dto.primaryTeacherId,
      substituteTeacherId: dto.substituteTeacherId,
      date: new Date(dto.date),
      timetablePeriodId: dto.timetablePeriodId,
      status: 'ASSIGNED',
    });

    // Real Expo push alert to the substitute teacher — sendPushNotifications
    // hits Expo's actual push API (notifications.service.ts), not a stub.
    const tokens = await this.notificationsService.getTokensForUsers(
      [dto.substituteTeacherId],
      'STAFF',
    );
    this.notificationsService
      .sendPushNotifications(
        tokens,
        'Timetable Substitution Assignment',
        `You have been assigned as a substitute teacher for slot ${sub.timetablePeriod.startTime}-${sub.timetablePeriod.endTime}.`,
      )
      .catch((err) =>
        console.error('Failed to notify substitute teacher', err),
      );

    // Also notify the affected class's families — previously only the
    // substitute teacher heard about this at all, so a parent/student found
    // out who was teaching their class only by walking in and seeing them.
    const sectionId = sub.timetablePeriod.section?.id;
    if (sectionId) {
      const studentIds =
        await this.repository.findEnrolledStudentIdsInSection(sectionId);
      const subjectName = sub.timetablePeriod.subject?.name;
      const msg = `${sub.substituteTeacher.fullName} will be covering ${subjectName ? `${subjectName} ` : ''}class on ${sub.date.toISOString().split('T')[0]} (${sub.timetablePeriod.startTime}-${sub.timetablePeriod.endTime}) in place of ${sub.primaryTeacher.fullName}.`;
      for (const studentId of studentIds) {
        this.commService
          .sendCustomAlert(studentId, 'Substitute Teacher Assigned', msg)
          .catch((err) =>
            console.error('Failed to notify family of substitution', err),
          );
      }
    }

    return sub;
  }

  async getSubstitutions(teacherId?: string) {
    const where = teacherId
      ? {
          OR: [
            { primaryTeacherId: teacherId },
            { substituteTeacherId: teacherId },
          ],
        }
      : undefined;
    return this.repository.findSubstitutions(where);
  }

  async getAvailableSubstituteTeachers(timetablePeriodId: string) {
    const period = await this.prisma.timetablePeriod.findUnique({
      where: { id: timetablePeriodId },
    });
    if (!period) throw new NotFoundException('Timetable period not found');

    // Fetch all teachers who don't have a class slot on the same day and time
    const busyTeachers = await this.prisma.timetablePeriod.findMany({
      where: {
        dayOfWeek: period.dayOfWeek,
        startTime: period.startTime,
        status: 'Active',
      },
      select: {
        assignment: {
          select: {
            staffId: true,
          },
        },
      },
    });

    const busyStaffIds = busyTeachers
      .filter((t) => t.assignment)
      .map((t) => t.assignment.staffId);

    return this.prisma.staff.findMany({
      where: {
        id: { notIn: busyStaffIds },
        status: 'Active',
      },
    });
  }
}
