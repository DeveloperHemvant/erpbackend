import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { VisitorRepository } from "./repositories/visitor.repository";
import { CreateVisitorDto, CreateStudentGatePassDto } from "./dto/visitor.dto";

@Injectable()
export class VisitorService {
  constructor(private readonly repository: VisitorRepository) {}

  async createVisitor(dto: CreateVisitorDto) {
    return this.repository.createVisitor({
      ...dto,
      hostConfirmation: dto.hostId ? "PENDING" : "APPROVED",
      status: "CheckedIn",
    });
  }

  async confirmVisitor(id: string, status: string) {
    const visitor = await this.repository.findVisitorById(id);
    if (!visitor) throw new NotFoundException("Visitor record not found");
    return this.repository.updateVisitor(id, { hostConfirmation: status });
  }

  async checkOutVisitor(id: string) {
    const visitor = await this.repository.findVisitorById(id);
    if (!visitor) throw new NotFoundException("Visitor record not found");
    if (visitor.status === "CheckedOut") throw new BadRequestException("Visitor already checked out");
    return this.repository.updateVisitor(id, {
      status: "CheckedOut",
      exitTime: new Date(),
    });
  }

  async getAllVisitors() {
    return this.repository.findVisitors();
  }

  async getVisitorById(id: string) {
    const visitor = await this.repository.findVisitorById(id);
    if (!visitor) throw new NotFoundException("Visitor record not found");
    return visitor;
  }

  async createGatePass(staffId: string, dto: CreateStudentGatePassDto) {
    return this.repository.createGatePass({
      studentId: dto.studentId,
      reason: dto.reason,
      leaveType: dto.leaveType,
      approvedById: staffId,
      status: "Approved",
    });
  }

  async verifyGatePassExit(id: string) {
    const pass = await this.repository.findGatePassById(id);
    if (!pass) throw new NotFoundException("Gate pass not found");
    return this.repository.updateGatePass(id, { exitTime: new Date() });
  }

  async recordGatePassReturn(id: string) {
    const pass = await this.repository.findGatePassById(id);
    if (!pass) throw new NotFoundException("Gate pass not found");
    return this.repository.updateGatePass(id, {
      returnTime: new Date(),
      status: "Returned",
    });
  }

  async getAllGatePasses() {
    return this.repository.findGatePasses();
  }
}
