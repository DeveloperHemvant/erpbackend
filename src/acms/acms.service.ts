import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // TERMS
  // ==========================================
  async getTerms() {
    return this.prisma.aCMSAcademicTerm.findMany({
      include: { session: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async createTerm(data: {
    sessionId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }) {
    return this.prisma.aCMSAcademicTerm.create({ data });
  }

  // ==========================================
  // HOLIDAYS
  // ==========================================
  async getHolidays() {
    return this.prisma.aCMSHolidayMaster.findMany({
      include: { campus: true },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(data: {
    name: string;
    date: Date;
    type: string;
    description?: string;
    campusId?: string;
  }) {
    return this.prisma.aCMSHolidayMaster.create({ data });
  }

  // ==========================================
  // WORKING DAYS
  // ==========================================
  async getWorkingDays() {
    return this.prisma.aCMSWorkingDay.findMany({
      include: { session: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async createWorkingDay(data: {
    sessionId: string;
    dayOfWeek: number;
    isWorkingDay?: boolean;
    isHalfDay?: boolean;
  }) {
    return this.prisma.aCMSWorkingDay.create({ data });
  }

  async updateWorkingDay(
    id: string,
    data: { isWorkingDay?: boolean; isHalfDay?: boolean },
  ) {
    const existing = await this.prisma.aCMSWorkingDay.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Working day entry not found');
    return this.prisma.aCMSWorkingDay.update({ where: { id }, data });
  }

  // ==========================================
  // EVENTS (Phase 2)
  // ==========================================
  async getEvents() {
    return this.prisma.aCMSEvent.findMany({
      include: { session: true, campus: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async getEvent(id: string) {
    const event = await this.prisma.aCMSEvent.findUnique({
      where: { id },
      include: { session: true, campus: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async createEvent(data: {
    sessionId: string;
    campusId?: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    type: string;
    organizer?: string;
    imageUrl?: string;
  }) {
    return this.prisma.aCMSEvent.create({ data });
  }

  async updateEvent(
    id: string,
    data: Partial<{
      sessionId: string;
      campusId: string;
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      type: string;
      organizer: string;
      imageUrl: string;
    }>,
  ) {
    await this.getEvent(id);
    return this.prisma.aCMSEvent.update({ where: { id }, data });
  }

  async deleteEvent(id: string) {
    await this.getEvent(id);
    return this.prisma.aCMSEvent.delete({ where: { id } });
  }

  async setEventImage(id: string, imageUrl: string) {
    await this.getEvent(id);
    return this.prisma.aCMSEvent.update({ where: { id }, data: { imageUrl } });
  }

  // ==========================================
  // RESOURCE BOOKINGS (Phase 2)
  // ==========================================
  async getBookings() {
    return this.prisma.aCMSResourceBooking.findMany({
      orderBy: { startDate: 'asc' },
    });
  }

  async createBooking(data: {
    resourceName: string;
    bookedBy: string;
    purpose: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Conflict Detection Logic
    const conflict = await this.prisma.aCMSResourceBooking.findFirst({
      where: {
        resourceName: data.resourceName,
        status: 'CONFIRMED',
        AND: [
          { startDate: { lt: data.endDate } },
          { endDate: { gt: data.startDate } },
        ],
      },
    });

    if (conflict) {
      throw new Error(
        `Conflict Detected: ${data.resourceName} is already booked from ${conflict.startDate.toLocaleString()} to ${conflict.endDate.toLocaleString()}`,
      );
    }

    return this.prisma.aCMSResourceBooking.create({ data });
  }

  // ==========================================
  // UNIFIED CALENDAR (Phase 3)
  // ==========================================
  async getUnifiedCalendar() {
    // Aggregates Holidays, Events, Exams, and Homework due dates into a
    // single timeline stream
    const holidays = await this.prisma.aCMSHolidayMaster.findMany();
    const events = await this.prisma.aCMSEvent.findMany();
    const exams = await this.prisma.eMSExamSchedule.findMany({
      include: { subject: true },
    });
    const homework = await this.prisma.lMSAssignment.findMany({
      where: { dueDate: { not: null } },
      include: { section: { include: { class: true } } },
    });

    const calendar = [
      ...holidays.map((h) => ({
        id: h.id,
        type: 'HOLIDAY',
        title: h.name,
        date: h.date,
        details: h.type,
      })),
      ...events.map((e) => ({
        id: e.id,
        type: 'EVENT',
        title: e.title,
        date: e.startDate,
        details: e.type,
        imageUrl: e.imageUrl,
      })),
      ...exams.map((e) => ({
        id: e.id,
        type: 'EXAM',
        title: `${e.subject?.name || 'Exam'}`,
        date: e.date,
        details: 'Academic Exam',
      })),
      ...homework.map((h) => ({
        id: h.id,
        type: 'HOMEWORK',
        title: h.title,
        date: h.dueDate as Date,
        details: h.section
          ? `${h.section.class?.grade || ''} - ${h.section.name}`.trim()
          : 'Homework Due',
      })),
    ];

    // Sort chronologically
    return calendar.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
