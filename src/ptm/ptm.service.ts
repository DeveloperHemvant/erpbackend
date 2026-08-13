import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PTMRepository } from './repositories/ptm.repository';
import { CreatePTMSlotDto } from './dto/ptm.dto';
import { CommunicationService } from '../communication/communication.service';

@Injectable()
export class PTMService {
  constructor(
    private readonly repository: PTMRepository,
    private readonly commService: CommunicationService,
  ) {}

  async createSlot(teacherId: string, dto: CreatePTMSlotDto) {
    return this.repository.create({
      teacherId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location || null,
    });
  }

  async getMySlots(teacherId: string) {
    return this.repository.findByTeacher(teacherId);
  }

  async getOpenSlotsForTeacher(teacherId: string) {
    return this.repository.findOpenByTeacher(teacherId);
  }

  async getMyBookings(parentId: string) {
    return this.repository.findByParent(parentId);
  }

  async bookSlot(id: string, parentId: string, studentId: string) {
    const slot = await this.repository.findById(id);
    if (!slot) throw new NotFoundException('PTM slot not found.');
    if (slot.status !== 'Open') {
      throw new BadRequestException('This slot is no longer available.');
    }
    const booked = await this.repository.book(id, parentId, studentId);

    this.commService
      .sendCustomAlert(
        studentId,
        'PTM Slot Booked',
        `Your parent-teacher meeting with ${booked.teacher?.fullName} is confirmed for ${booked.date.toISOString().split('T')[0]}, ${booked.startTime}-${booked.endTime}.`,
      )
      .catch((err) => console.error('Failed to notify family of PTM booking', err));

    return booked;
  }

  async cancelBooking(id: string, parentId: string) {
    const slot = await this.repository.findById(id);
    if (!slot) throw new NotFoundException('PTM slot not found.');
    if (slot.status !== 'Booked' || slot.parentId !== parentId) {
      throw new ForbiddenException('You can only cancel your own booking.');
    }
    return this.repository.cancel(id);
  }

  async deleteSlot(id: string, teacherId: string) {
    const slot = await this.repository.findById(id);
    if (!slot) throw new NotFoundException('PTM slot not found.');
    if (slot.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own slots.');
    }
    if (slot.status === 'Booked') {
      throw new BadRequestException(
        'This slot is already booked — cancel the booking first.',
      );
    }
    return this.repository.delete(id);
  }
}
