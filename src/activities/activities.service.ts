import { Injectable } from "@nestjs/common";
import { ActivitiesRepository } from "./repositories/activities.repository";
import {
  CreateAssemblyDto,
  CreateSchoolEventDto,
  CreateStudentAchievementDto,
  CreateStaffDutyDto,
} from "./dto/activities.dto";

@Injectable()
export class ActivitiesService {
  constructor(private readonly repository: ActivitiesRepository) {}

  async createAssembly(dto: CreateAssemblyDto) {
    return this.repository.createAssembly({
      date: new Date(dto.date),
      campusId: dto.campusId,
      theme: dto.theme,
      performingSectionId: dto.performingSectionId,
      supervisingStaffId: dto.supervisingStaffId,
      venue: dto.venue,
      activities: dto.activities,
    });
  }

  async getAllAssemblies(campusId?: string) {
    const where = campusId ? { campusId } : undefined;
    return this.repository.findAssemblies(where);
  }

  async createSchoolEvent(dto: CreateSchoolEventDto) {
    return this.repository.createSchoolEvent({
      title: dto.title,
      type: dto.type,
      date: new Date(dto.date),
      campusId: dto.campusId,
      description: dto.description,
    });
  }

  async getAllSchoolEvents(campusId?: string) {
    const where = campusId ? { campusId } : undefined;
    return this.repository.findSchoolEvents(where);
  }

  async awardHousePoints(houseId: string, points: number) {
    return this.repository.updateHousePoints(houseId, points);
  }

  async getHouseStandings() {
    return this.repository.findHouses();
  }

  async createAchievement(staffId: string, dto: CreateStudentAchievementDto) {
    return this.repository.createAchievement({
      studentId: dto.studentId,
      type: dto.type,
      title: dto.title,
      award: dto.award,
      issuedById: staffId,
      certificateData: {},
    });
  }

  async getStudentAchievements(studentId: string) {
    return this.repository.findAchievementsByStudent(studentId);
  }

  async createStaffDuty(dto: CreateStaffDutyDto) {
    return this.repository.createStaffDuty({
      staffId: dto.staffId,
      dutyType: dto.dutyType,
      date: new Date(dto.date),
      notes: dto.notes,
    });
  }

  async getStaffDuties(staffId?: string) {
    const where = staffId ? { staffId } : undefined;
    return this.repository.findStaffDuties(where);
  }
}
