// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { AssignmentRepository } from "./repositories/assignment.repository";
import { CreateAssignmentDto } from "./dto/assignment.dto";

@Injectable()
export class AcademicsService {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async createAssignment(dto: CreateAssignmentDto) {
    return this.assignmentRepository.create({ ...dto, createdBy: "SYSTEM" });
  }

  async getAssignments() {
    return this.assignmentRepository.findAll();
  }

  async deleteAssignment(id: string) {
    return this.assignmentRepository.delete(id);
  }
}
