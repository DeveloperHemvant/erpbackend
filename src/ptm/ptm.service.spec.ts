import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PTMService } from './ptm.service';
import { PTMRepository } from './repositories/ptm.repository';
import { CommunicationService } from '../communication/communication.service';

describe('PTMService', () => {
  let service: PTMService;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTeacher: jest.fn(),
    findOpenByTeacher: jest.fn(),
    findByParent: jest.fn(),
    book: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  };

  const mockCommService = {
    sendCustomAlert: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCommService.sendCustomAlert.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PTMService,
        { provide: PTMRepository, useValue: mockRepository },
        { provide: CommunicationService, useValue: mockCommService },
      ],
    }).compile();

    service = module.get<PTMService>(PTMService);
  });

  describe('createSlot', () => {
    it('creates a slot scoped to the given teacher', async () => {
      mockRepository.create.mockResolvedValue({ id: 'slot-1' });
      await service.createSlot('teacher-1', {
        date: '2026-09-01',
        startTime: '10:00',
        endTime: '10:15',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        teacherId: 'teacher-1',
        date: new Date('2026-09-01'),
        startTime: '10:00',
        endTime: '10:15',
        location: null,
      });
    });
  });

  describe('bookSlot', () => {
    it('throws NotFoundException for a missing slot', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(
        service.bookSlot('missing', 'parent-1', 'student-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the slot is not Open', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', status: 'Booked' });
      await expect(
        service.bookSlot('slot-1', 'parent-1', 'student-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.book).not.toHaveBeenCalled();
    });

    it('books an open slot and notifies the family', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', status: 'Open' });
      mockRepository.book.mockResolvedValue({
        id: 'slot-1',
        status: 'Booked',
        date: new Date('2026-09-01'),
        startTime: '10:00',
        endTime: '10:15',
        teacher: { fullName: 'Mr. Rao' },
      });

      const result = await service.bookSlot('slot-1', 'parent-1', 'student-1');

      expect(mockRepository.book).toHaveBeenCalledWith('slot-1', 'parent-1', 'student-1');
      expect(mockCommService.sendCustomAlert).toHaveBeenCalledWith(
        'student-1',
        'PTM Slot Booked',
        expect.stringContaining('Mr. Rao'),
      );
      expect(result.status).toBe('Booked');
    });
  });

  describe('cancelBooking', () => {
    it('throws NotFoundException for a missing slot', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.cancelBooking('missing', 'parent-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the slot is not booked by this parent', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', status: 'Booked', parentId: 'someone-else' });
      await expect(service.cancelBooking('slot-1', 'parent-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepository.cancel).not.toHaveBeenCalled();
    });

    it('cancels a booking the parent owns', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', status: 'Booked', parentId: 'parent-1' });
      mockRepository.cancel.mockResolvedValue({ id: 'slot-1', status: 'Open' });

      const result = await service.cancelBooking('slot-1', 'parent-1');

      expect(mockRepository.cancel).toHaveBeenCalledWith('slot-1');
      expect(result.status).toBe('Open');
    });
  });

  describe('deleteSlot', () => {
    it('throws ForbiddenException when the slot belongs to another teacher', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', teacherId: 'other-teacher', status: 'Open' });
      await expect(service.deleteSlot('slot-1', 'teacher-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when the slot is already booked', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', teacherId: 'teacher-1', status: 'Booked' });
      await expect(service.deleteSlot('slot-1', 'teacher-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes an unbooked slot owned by the caller', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'slot-1', teacherId: 'teacher-1', status: 'Open' });
      mockRepository.delete.mockResolvedValue({ id: 'slot-1' });

      await service.deleteSlot('slot-1', 'teacher-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('slot-1');
    });
  });
});
