import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DisciplineRepository {
  constructor(private readonly prisma: PrismaService) {}

  createIncident(data: Prisma.DisciplineIncidentUncheckedCreateInput) {
    return this.prisma.disciplineIncident.create({
      data,
      include: { student: true, reportedByStaff: true },
    });
  }

  /** Staff view — includes confidential counseling notes. */
  findIncidentsForStudentFull(studentId: string) {
    return this.prisma.disciplineIncident.findMany({
      where: { studentId },
      include: {
        reportedByStaff: true,
        counselingNotes: { include: { createdByStaff: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  /** Parent/student view — counseling notes are staff-confidential, deliberately omitted. */
  findIncidentsForStudentBasic(studentId: string) {
    return this.prisma.disciplineIncident.findMany({
      where: { studentId },
      select: {
        id: true,
        incidentDate: true,
        category: true,
        severity: true,
        description: true,
        actionTaken: true,
        status: true,
        createdAt: true,
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  findAllIncidents() {
    return this.prisma.disciplineIncident.findMany({
      include: { student: true, reportedByStaff: true },
      orderBy: { incidentDate: 'desc' },
    });
  }

  findIncidentById(id: string) {
    return this.prisma.disciplineIncident.findUnique({
      where: { id },
      include: {
        student: true,
        reportedByStaff: true,
        counselingNotes: { include: { createdByStaff: true } },
      },
    });
  }

  updateIncident(
    id: string,
    data: Prisma.DisciplineIncidentUncheckedUpdateInput,
  ) {
    return this.prisma.disciplineIncident.update({ where: { id }, data });
  }

  addCounselingNote(data: Prisma.DisciplineCounselingNoteUncheckedCreateInput) {
    return this.prisma.disciplineCounselingNote.create({
      data,
      include: { createdByStaff: true },
    });
  }
}
