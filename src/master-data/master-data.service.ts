// @ts-nocheck
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSessionDto,
  CreateCampusDto,
  CreateClassDto,
  CreateSubjectDto,
  CreateAssignmentDto,
  UpdateSessionDto,
  UpdateCampusDto,
  UpdateClassDto,
  UpdateSubjectDto,
  UpdateAssignmentDto
} from "./dto/master-data.dto";

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // ACADEMIC SESSIONS SERVICES
  // ==========================================
  async createSession(dto: CreateSessionDto) {
    const existing = await this.prisma.academicSession.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Session "${dto.name}" already exists.`);
    }

    return this.prisma.academicSession.create({
      data: {
        name: dto.name,
        isActive: dto.isActive || false,
        createdBy: "SYSTEM",
      },
    });
  }

  async getSessions() {
    return this.prisma.academicSession.findMany({
      orderBy: { name: "desc" },
    });
  }

  async setActiveSession(id: string) {
    // Verify session exists
    const session = await this.prisma.academicSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Academic Session with ID "${id}" not found.`);
    }

    // Set all other sessions to inactive and the targeted one to active
    await this.prisma.$transaction([
      this.prisma.academicSession.updateMany({
        data: { isActive: false },
      }),
      this.prisma.academicSession.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return { message: `Session "${session.name}" is now the active academic session.` };
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    return this.prisma.academicSession.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        updatedBy: "SYSTEM",
      }
    });
  }

  // ==========================================
  // CAMPUS SERVICES
  // ==========================================
  async createCampus(dto: CreateCampusDto) {
    const existing = await this.prisma.campus.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Campus "${dto.name}" already registered.`);
    }

    let profileId = dto.schoolProfileId;
    if (!profileId) {
      const profile = await this.prisma.schoolProfile.findFirst();
      if (!profile) throw new BadRequestException("No School Profile found. Please initialize the school first.");
      profileId = profile.id;
    }

    return this.prisma.campus.create({
      data: {
        name: dto.name,
        address: dto.address,
        capacity: parseInt(dto.capacity.toString(), 10),
        schoolProfileId: profileId,
        createdBy: "SYSTEM",
      },
    });
  }

  async getCampuses() {
    return this.prisma.campus.findMany({ orderBy: { name: "asc" } });
  }

  async deleteCampus(id: string) {
    return this.prisma.campus.delete({ where: { id } });
  }

  async updateCampus(id: string, dto: UpdateCampusDto) {
    const updateData: any = { ...dto, updatedBy: "SYSTEM" };
    if (dto.capacity) {
      updateData.capacity = parseInt(dto.capacity.toString(), 10);
    }

    return this.prisma.campus.update({
      where: { id },
      data: updateData
    });
  }

  // ==========================================
  // CLASSES & SECTIONS SERVICES
  // ==========================================
  async createClass(dto: CreateClassDto) {
    return this.prisma.class.create({
      data: {
        grade: dto.grade,
        campusId: dto.campusId,
        sessionId: dto.sessionId,
        createdBy: "SYSTEM",
        sections: {
          create: dto.sections?.map(s => ({ name: s, createdBy: "SYSTEM" })) || []
        }
      },
      include: { campus: true, session: true, sections: true },
    });
  }

  async getClasses() {
    return this.prisma.class.findMany({
      include: { campus: true, session: true, sections: true },
      orderBy: { grade: "asc" },
    });
  }

  async deleteClass(id: string) {
    return this.prisma.class.delete({ where: { id } });
  }

  async updateClass(id: string, dto: UpdateClassDto) {
    return this.prisma.class.update({
      where: { id },
      data: {
        grade: dto.grade,
        campusId: dto.campusId,
        sessionId: dto.sessionId,
        updatedBy: "SYSTEM",
      },
      include: { campus: true, session: true, sections: true },
    });
  }

  // ==========================================
  // SUBJECT MODULES SERVICES
  // ==========================================
  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        classes: { create: [{ classId: dto.classId }] },
        medium: dto.medium,
        createdBy: "SYSTEM",
      },
      include: { classes: { include: { class: true } } },
    });
  }

  async getSubjects() {
    return this.prisma.subject.findMany({
      include: { classes: { include: { class: { include: { campus: true } } } } },
      orderBy: { name: "asc" },
    });
  }

  async deleteSubject(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name,
        medium: dto.medium,
        updatedBy: "SYSTEM",
      },
      include: { classes: { include: { class: true } } },
    });
  }

  // ==========================================
  // TEACHER ASSIGNMENT SERVICES
  // ==========================================
  async createAllocation(dto: CreateAssignmentDto) {
    return this.prisma.teacherAssignment.create({
      data: {
        staffId: dto.staffId,
        sessionId: dto.sessionId,
        subjectId: dto.subjectId || null,
        sectionId: dto.sectionId || null,
        hoursPerWeek: dto.hoursPerWeek,
        createdBy: "SYSTEM",
      },
      include: { session: true },
    });
  }

  async getAllocations() {
    return this.prisma.teacherAssignment.findMany({
      include: { 
        session: true, 
        subject: { include: { classes: { include: { class: { include: { campus: true } } } } } }, 
        section: { include: { class: { include: { campus: true } } } },
        staff: true
      },
    });
  }

  async deleteAllocation(id: string) {
    return this.prisma.teacherAssignment.delete({ where: { id } });
  }

  async updateAllocation(id: string, dto: UpdateAssignmentDto) {
    return this.prisma.teacherAssignment.update({
      where: { id },
      data: {
        staffId: dto.staffId,
        sessionId: dto.sessionId,
        subjectId: dto.subjectId || null,
        sectionId: dto.sectionId || null,
        hoursPerWeek: dto.workload,
        updatedBy: "SYSTEM",
      },
      include: { session: true },
    });
  }

  // ==========================================
  // ROOM SERVICES
  // ==========================================
  async createRoom(dto: { name: string; capacity: number; campusId: string }) {
    return this.prisma.room.create({
      data: {
        name: dto.name,
        capacity: parseInt(dto.capacity.toString(), 10),
        campusId: dto.campusId,
      },
      include: { campus: true },
    });
  }

  async getRooms() {
    return this.prisma.room.findMany({
      include: { campus: true },
      orderBy: { name: "asc" },
    });
  }

  async deleteRoom(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }
}
