import { Injectable } from "@nestjs/common";
import { MedicalRepository } from "./repositories/medical.repository";
import { CreateMedicalVisitDto } from "./dto/medical.dto";

@Injectable()
export class MedicalService {
  constructor(private readonly repository: MedicalRepository) {}

  async createVisit(staffId: string, dto: CreateMedicalVisitDto) {
    return this.repository.createVisit({
      studentId: dto.studentId,
      symptoms: dto.symptoms,
      treatment: dto.treatment,
      medicineIssued: dto.medicineIssued,
      referredToDoctor: dto.referredToDoctor,
      loggedById: staffId,
      status: "COMPLETED",
    });
  }

  async getVisits(studentId?: string) {
    const where = studentId ? { studentId } : undefined;
    return this.repository.findVisits(where);
  }
}
