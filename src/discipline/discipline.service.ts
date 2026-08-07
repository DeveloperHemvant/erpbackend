import { Injectable, NotFoundException } from '@nestjs/common';
import { DisciplineRepository } from './repositories/discipline.repository';
import { CommunicationService } from '../communication/communication.service';
import {
  CreateDisciplineIncidentDto,
  UpdateDisciplineIncidentDto,
  AddCounselingNoteDto,
} from './dto/discipline.dto';

@Injectable()
export class DisciplineService {
  constructor(
    private readonly repository: DisciplineRepository,
    private readonly communicationService: CommunicationService,
  ) {}

  async createIncident(
    studentId: string,
    staffId: string,
    dto: CreateDisciplineIncidentDto,
  ) {
    const { notifyParent, ...rest } = dto;
    const incident = await this.repository.createIncident({
      studentId,
      reportedByStaffId: staffId,
      ...rest,
      parentNotified: !!notifyParent,
    });

    if (notifyParent) {
      const title = 'Discipline Notice';
      const body = `A disciplinary incident (${incident.category}, ${incident.severity}) was recorded for ${incident.student.fullName}. ${dto.description}`;
      this.communicationService
        .sendCustomAlert(studentId, title, body)
        .catch((err) =>
          console.error('Failed to notify parent of discipline incident', err),
        );
    }

    return incident;
  }

  async getIncidentsForStudentFull(studentId: string) {
    return this.repository.findIncidentsForStudentFull(studentId);
  }

  async getIncidentsForStudentBasic(studentId: string) {
    return this.repository.findIncidentsForStudentBasic(studentId);
  }

  async getAllIncidents() {
    return this.repository.findAllIncidents();
  }

  async updateIncident(id: string, dto: UpdateDisciplineIncidentDto) {
    const existing = await this.repository.findIncidentById(id);
    if (!existing) throw new NotFoundException('Discipline incident not found');
    return this.repository.updateIncident(id, dto);
  }

  async addCounselingNote(
    incidentId: string,
    staffId: string,
    dto: AddCounselingNoteDto,
  ) {
    const existing = await this.repository.findIncidentById(incidentId);
    if (!existing) throw new NotFoundException('Discipline incident not found');
    return this.repository.addCounselingNote({
      incidentId,
      createdByStaffId: staffId,
      note: dto.note,
    });
  }
}
