import { Injectable } from "@nestjs/common";
import { HealthRecordsRepository } from "./repositories/health-records.repository";
import { CommunicationService } from "../communication/communication.service";
import { UpsertHealthProfileDto, CreateHealthVisitDto, CreateVaccinationDto } from "./dto/health-records.dto";

@Injectable()
export class HealthRecordsService {
  constructor(
    private readonly repository: HealthRecordsRepository,
    private readonly communicationService: CommunicationService,
  ) {}

  async getProfile(studentId: string) {
    return this.repository.findProfileByStudent(studentId);
  }

  async upsertProfile(studentId: string, dto: UpsertHealthProfileDto) {
    return this.repository.upsertProfile(studentId, dto);
  }

  async logVisit(studentId: string, staffId: string, dto: CreateHealthVisitDto) {
    const { notifyParent, ...rest } = dto;
    const visit = await this.repository.createVisit({
      studentId,
      loggedByStaffId: staffId,
      ...rest,
      parentNotified: !!notifyParent,
    });

    if (notifyParent) {
      const title = "Health Centre Visit";
      const body = `${visit.student.fullName} visited the health centre today: ${dto.reason}. Action taken: ${visit.actionTaken}.`;
      this.communicationService.sendCustomAlert(studentId, title, body).catch((err) => console.error("Failed to notify parent of health visit", err));
    }

    return visit;
  }

  async getVisitsForStudent(studentId: string) {
    return this.repository.findVisitsForStudent(studentId);
  }

  async getVisitsToday() {
    return this.repository.findVisitsForDate(new Date());
  }

  async addVaccination(studentId: string, dto: CreateVaccinationDto) {
    return this.repository.createVaccination({
      studentId,
      vaccineName: dto.vaccineName,
      doseNumber: dto.doseNumber ?? 1,
      dateAdministered: new Date(dto.dateAdministered),
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
      administeredBy: dto.administeredBy,
      certificateUrl: dto.certificateUrl,
    });
  }

  async getVaccinationsForStudent(studentId: string) {
    return this.repository.findVaccinationsForStudent(studentId);
  }
}
