import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TimetableRepository } from './repositories/timetable.repository';
import {
  CreateTimetableDto,
  CreateTimetablePeriodDto,
} from './dto/timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly timetableRepository: TimetableRepository) {}

  // ==========================================
  // TIMETABLE SLOTS
  // ==========================================
  async createTimetableSlot(dto: any) {
    return this.timetableRepository.createSlot({ ...dto, createdBy: 'SYSTEM' });
  }

  async getTimetableSlots() {
    return this.timetableRepository.findAllSlots();
  }

  async deleteTimetableSlot(id: string) {
    return this.timetableRepository.deleteSlot(id);
  }

  async seedTimetableSlots(sessionId: string) {
    await this.timetableRepository.deleteSlotsBySession(sessionId);

    const slots = [
      {
        name: 'Morning Assembly',
        startTime: '08:00 AM',
        endTime: '08:20 AM',
        isBreak: true,
      },
      {
        name: 'Period 1',
        startTime: '08:20 AM',
        endTime: '09:00 AM',
        isBreak: false,
      },
      {
        name: 'Period 2',
        startTime: '09:00 AM',
        endTime: '09:40 AM',
        isBreak: false,
      },
      {
        name: 'Water Break',
        startTime: '09:40 AM',
        endTime: '09:50 AM',
        isBreak: true,
      },
      {
        name: 'Period 3',
        startTime: '09:50 AM',
        endTime: '10:30 AM',
        isBreak: false,
      },
      {
        name: 'Period 4',
        startTime: '10:30 AM',
        endTime: '11:10 AM',
        isBreak: false,
      },
      {
        name: 'Lunch Break',
        startTime: '11:10 AM',
        endTime: '11:50 AM',
        isBreak: true,
      },
      {
        name: 'Period 5',
        startTime: '11:50 AM',
        endTime: '12:30 PM',
        isBreak: false,
      },
      {
        name: 'Period 6',
        startTime: '12:30 PM',
        endTime: '01:10 PM',
        isBreak: false,
      },
      {
        name: 'Water Break',
        startTime: '01:10 PM',
        endTime: '01:20 PM',
        isBreak: true,
      },
      {
        name: 'Period 7',
        startTime: '01:20 PM',
        endTime: '02:00 PM',
        isBreak: false,
      },
      {
        name: 'Period 8',
        startTime: '02:00 PM',
        endTime: '02:40 PM',
        isBreak: false,
      },
    ];

    for (const slot of slots) {
      await this.timetableRepository.createSlotBulkItem({
        ...slot,
        sessionId,
        createdBy: 'SYSTEM',
      });
    }

    return { message: 'Slots seeded successfully' };
  }

  // ==========================================
  // TIMETABLES
  // ==========================================
  async createTimetable(dto: CreateTimetableDto) {
    return this.timetableRepository.createTimetable({ ...dto });
  }

  async getTimetables() {
    return this.timetableRepository.findAllTimetables();
  }

  async activateTimetable(timetableId: string) {
    const timetable =
      await this.timetableRepository.findTimetableById(timetableId);
    if (!timetable) throw new NotFoundException('Timetable not found');

    // Deactivate all in the same session
    await this.timetableRepository.deactivateTimetablesInSession(
      timetable.sessionId,
    );

    // Activate this one
    return this.timetableRepository.activateTimetable(timetableId);
  }

  async autoGenerateTimetable(timetableId: string) {
    const timetable =
      await this.timetableRepository.findTimetableByIdWithSession(timetableId);
    if (!timetable) throw new NotFoundException('Timetable not found');

    // Periods with a real substitution record can't be deleted (Postgres
    // RESTRICT — see repository comment), so leave them alone entirely:
    // skip clearing them, and skip regenerating anything that would land on
    // the same section/day/slot as one, to avoid a duplicate/conflicting row.
    const protectedPeriods =
      await this.timetableRepository.findProtectedPeriodsByTimetable(
        timetableId,
      );
    const protectedKeys = new Set(
      protectedPeriods.map(
        (p) => `${p.sectionId}|${p.dayOfWeek}|${p.startTime}`,
      ),
    );

    // Clear existing periods (protected ones are excluded automatically)
    await this.timetableRepository.deletePeriodsByTimetable(timetableId);

    // Fetch required data
    const slots = await this.timetableRepository.findNonBreakSlotsBySession(
      timetable.sessionId,
    );
    const sections = await this.timetableRepository.findSectionsBySession(
      timetable.sessionId,
    );
    const assignments =
      await this.timetableRepository.findTeacherAssignmentsBySession(
        timetable.sessionId,
      );

    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    // Greedy Assignment Tracker: tracker[day][slotId][teacherStaffId] = true
    const teacherTracker: Record<
      string,
      Record<string, Record<string, boolean>>
    > = {};
    days.forEach((d) => {
      teacherTracker[d] = {};
      slots.forEach((s) => (teacherTracker[d][s.id] = {}));
    });

    const classSubjects =
      await this.timetableRepository.findClassSubjectsBySession(
        timetable.sessionId,
      );

    const newPeriods: any[] = [];

    // Sort slots by start time to ensure slots[0] is the actual first period
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const day of days) {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const isFirstPeriod = i === 0;

        for (const section of sections) {
          if (protectedKeys.has(`${section.id}|${day}|${slot.startTime}`)) {
            continue; // A substitution is already pinned to this exact slot
          }

          const sectionAssignments = assignments.filter(
            (a) => a.sectionId === section.id,
          );

          let chosen: (typeof assignments)[number] | null = null;

          if (isFirstPeriod) {
            // First period MUST be class teacher (assignment with subjectId = null)
            chosen =
              sectionAssignments.find((a) => a.subjectId === null) ?? null;
          }

          if (!chosen) {
            // Regular period (or no class teacher found for 1st period)
            // Find subjects that this section's class has
            const sectionSubjects = classSubjects
              .filter((cs) => cs.classId === section.classId)
              .map((cs) => cs.subjectId);

            // Pick a random unassigned teacher that teaches one of these subjects
            const availableAssignments = assignments.filter(
              (a) =>
                a.subjectId !== null &&
                sectionSubjects.includes(a.subjectId) &&
                !teacherTracker[day][slot.id][a.staffId],
            );

            if (availableAssignments.length > 0) {
              chosen =
                availableAssignments[
                  Math.floor(Math.random() * availableAssignments.length)
                ];
            }
          }

          if (chosen) {
            teacherTracker[day][slot.id][chosen.staffId] = true;

            newPeriods.push({
              timetableId,
              sectionId: section.id,
              subjectId: chosen.subjectId,
              assignmentId: chosen.id,
              dayOfWeek: day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: section.name,
              createdBy: 'SYSTEM',
            });
          }
        }
      }
    }

    if (newPeriods.length > 0) {
      await this.timetableRepository.createManyPeriods(newPeriods);
    }

    return {
      message: 'Auto-generation complete',
      periodsGenerated: newPeriods.length,
    };
  }

  // ==========================================
  // TIMETABLE PERIODS
  // ==========================================
  async createTimetablePeriod(dto: CreateTimetablePeriodDto) {
    const assignment = await this.timetableRepository.findTeacherAssignmentById(
      dto.assignmentId,
    );
    if (!assignment)
      throw new NotFoundException('Teacher assignment not found');

    const clashes = await this.timetableRepository.findClashingPeriods(
      assignment.staffId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    if (clashes.length > 0) {
      throw new ConflictException(
        'Clash detected: This teacher is already booked during this time on this day.',
      );
    }

    return this.timetableRepository.createPeriod({
      ...dto,
      createdBy: 'SYSTEM',
    });
  }

  async getSubstituteSuggestions(
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    subjectId: string,
  ) {
    // 1. Find all teacher assignments for this subject
    const assignments =
      await this.timetableRepository.findTeacherAssignmentsForSubject(
        subjectId,
      );

    if (assignments.length === 0) return [];
    const teacherIds = assignments.map((a) => a.staffId);

    // 2. Find who is already booked at that time (clashing)
    const busyPeriods = await this.timetableRepository.findBusyPeriods(
      teacherIds,
      dayOfWeek,
      startTime,
      endTime,
    );

    const busyTeacherIds = busyPeriods.map((p) => p.assignment.staffId);

    // 3. Filter out busy teachers
    const freeTeachers = assignments.filter(
      (a) => !busyTeacherIds.includes(a.staffId),
    );

    // Deduplicate unique staff records
    const uniqueFreeStaff = Array.from(
      new Set(freeTeachers.map((a) => a.staff.id)),
    ).map((id) => freeTeachers.find((a) => a.staff.id === id)?.staff);

    return uniqueFreeStaff;
  }

  async getTimetablePeriods() {
    return this.timetableRepository.findAllPeriods();
  }

  async deleteTimetablePeriod(id: string) {
    return this.timetableRepository.deletePeriod(id);
  }
}
