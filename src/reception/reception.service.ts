import { Injectable } from '@nestjs/common';
import { ReceptionRepository } from './repositories/reception.repository';

@Injectable()
export class ReceptionService {
  constructor(private readonly repository: ReceptionRepository) {}

  async logCourier(
    loggedById: string,
    dto: { type: string; sender?: string; recipient?: string; description: string },
  ) {
    return this.repository.createCourierLog({ ...dto, loggedById });
  }

  async getCourierLogs() {
    return this.repository.findCourierLogs();
  }

  async updateCourierStatus(id: string, status: string) {
    return this.repository.updateCourierLog(id, { status });
  }

  async createAppointment(
    hostId: string | null,
    dto: { visitorName: string; purpose: string; scheduledFor: string },
  ) {
    return this.repository.createAppointment({
      visitorName: dto.visitorName,
      purpose: dto.purpose,
      scheduledFor: new Date(dto.scheduledFor),
      hostId: hostId ?? undefined,
    });
  }

  async getAppointments() {
    return this.repository.findAppointments();
  }

  async updateAppointmentStatus(id: string, status: string) {
    return this.repository.updateAppointment(id, { status });
  }
}
