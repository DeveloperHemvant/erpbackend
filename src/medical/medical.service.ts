import { Injectable } from "@nestjs/common";
import { MedicalRepository } from "./repositories/medical.repository";
import { CreateMedicalVisitDto } from "./dto/medical.dto";

@Injectable()
export class MedicalService {
  constructor(private readonly repository: MedicalRepository) {}

  async createVisit(staffId: string, dto: CreateMedicalVisitDto) {
    return this.repository.createVisit({
      studentId: dto.studentId,
      reason: dto.symptoms || "Medical Room Visit",
      symptoms: dto.symptoms,
      treatmentGiven: dto.treatment || dto.medicineIssued || "First Aid",
      actionTaken: dto.referredToDoctor ? "Referred to Doctor" : "Observed and Released",
      loggedByStaffId: staffId,
      visitDate: new Date(),
    });
  }

  async getVisits(studentId?: string) {
    const where = studentId ? { studentId } : undefined;
    return this.repository.findVisits(where);
  }
}
