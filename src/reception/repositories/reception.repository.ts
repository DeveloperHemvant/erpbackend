import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  createCourierLog(data: Prisma.CourierLogUncheckedCreateInput) {
    return this.prisma.courierLog.create({ data });
  }

  findCourierLogs() {
    return this.prisma.courierLog.findMany({
      include: { loggedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateCourierLog(id: string, data: Prisma.CourierLogUncheckedUpdateInput) {
    return this.prisma.courierLog.update({ where: { id }, data });
  }

  createAppointment(data: Prisma.AppointmentUncheckedCreateInput) {
    return this.prisma.appointment.create({ data });
  }

  findAppointments() {
    return this.prisma.appointment.findMany({
      include: { host: { select: { id: true, fullName: true } } },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  updateAppointment(id: string, data: Prisma.AppointmentUncheckedUpdateInput) {
    return this.prisma.appointment.update({ where: { id }, data });
  }
}
