import { Injectable, NotFoundException } from "@nestjs/common";
import { SubstitutionRepository } from "./repositories/substitution.repository";
import { CreateSubstitutionDto } from "./dto/substitution.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SubstitutionService {
  constructor(
    private readonly repository: SubstitutionRepository,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async createSubstitution(dto: CreateSubstitutionDto) {
    const sub = await this.repository.createSubstitution({
      leaveApplicationId: dto.leaveApplicationId,
      primaryTeacherId: dto.primaryTeacherId,
      substituteTeacherId: dto.substituteTeacherId,
      date: new Date(dto.date),
      timetablePeriodId: dto.timetablePeriodId,
      status: "ASSIGNED",
    });

    // Mock sending push alerts to substitute teacher
    const tokens = await this.notificationsService.getTokensForUsers([dto.substituteTeacherId], "STAFF");
    this.notificationsService.sendPushNotifications(
      tokens,
      "Timetable Substitution Assignment",
      `You have been assigned as a substitute teacher for slot ${sub.timetablePeriod.startTime}-${sub.timetablePeriod.endTime}.`
    ).catch(err => console.error("Failed to notify substitute teacher", err));

    return sub;
  }

  async getSubstitutions(teacherId?: string) {
    const where = teacherId
      ? { OR: [{ primaryTeacherId: teacherId }, { substituteTeacherId: teacherId }] }
      : undefined;
    return this.repository.findSubstitutions(where);
  }

  async getAvailableSubstituteTeachers(timetablePeriodId: string) {
    const period = await this.prisma.timetablePeriod.findUnique({
      where: { id: timetablePeriodId },
    });
    if (!period) throw new NotFoundException("Timetable period not found");

    // Fetch all teachers who don't have a class slot on the same day and time
    const busyTeachers = await this.prisma.timetablePeriod.findMany({
      where: {
        dayOfWeek: period.dayOfWeek,
        startTime: period.startTime,
        status: "Active",
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
        status: "Active",
      },
    });
  }
}
