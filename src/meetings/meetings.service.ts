import { Injectable } from '@nestjs/common';
import { MeetingsRepository } from './repositories/meetings.repository';

@Injectable()
export class MeetingsService {
  constructor(private readonly repository: MeetingsRepository) {}

  async createMeeting(
    organizerId: string,
    dto: {
      title: string;
      agenda?: string;
      scheduledFor: string;
      location?: string;
      attendeeIds?: string[];
    },
  ) {
    return this.repository.create({
      title: dto.title,
      agenda: dto.agenda,
      scheduledFor: new Date(dto.scheduledFor),
      location: dto.location,
      attendeeIds: dto.attendeeIds ?? undefined,
      organizerId,
    });
  }

  async getMeetings() {
    return this.repository.findAll();
  }

  async updateMeetingStatus(id: string, status: string) {
    return this.repository.update(id, { status });
  }
}
