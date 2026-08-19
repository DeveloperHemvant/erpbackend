import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmsService } from './ems.service';
import { EmsRepository } from './repositories/ems.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunicationService } from '../communication/communication.service';
import { OwnershipService } from '../auth/ownership.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

describe('EmsService — hall tickets', () => {
  let service: EmsService;

  const mockRepository = {
    findSessionById: jest.fn(),
    findStudentForHallTicket: jest.fn(),
    findSeatingsForStudentInSession: jest.fn(),
    findMasterRoomsByIds: jest.fn(),
  };

  const mockRenderer = {
    renderHallTicket: jest.fn(),
  };

  const mockStorage = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsService,
        { provide: EmsRepository, useValue: mockRepository },
        { provide: NotificationsService, useValue: {} },
        { provide: CommunicationService, useValue: {} },
        { provide: OwnershipService, useValue: {} },
        { provide: DocumentRenderingService, useValue: mockRenderer },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<EmsService>(EmsService);
  });

  describe('getStudentHallTicketData', () => {
    it('throws NotFoundException when the session does not exist', async () => {
      mockRepository.findSessionById.mockResolvedValue(null);
      await expect(
        service.getStudentHallTicketData('student-1', 'missing-session'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the student does not exist', async () => {
      mockRepository.findSessionById.mockResolvedValue({ id: 'session-1', name: 'Finals' });
      mockRepository.findStudentForHallTicket.mockResolvedValue(null);
      await expect(
        service.getStudentHallTicketData('missing-student', 'session-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when no seating plan has been published', async () => {
      mockRepository.findSessionById.mockResolvedValue({ id: 'session-1', name: 'Finals' });
      mockRepository.findStudentForHallTicket.mockResolvedValue({
        id: 'student-1',
        fullName: 'Asha Rao',
        admissionNumber: 'A-001',
        photoUrl: null,
        enrollments: [],
      });
      mockRepository.findSeatingsForStudentInSession.mockResolvedValue([]);

      await expect(
        service.getStudentHallTicketData('student-1', 'session-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('assembles hall ticket data from the seating plan', async () => {
      mockRepository.findSessionById.mockResolvedValue({ id: 'session-1', name: 'Finals' });
      mockRepository.findStudentForHallTicket.mockResolvedValue({
        id: 'student-1',
        fullName: 'Asha Rao',
        admissionNumber: 'A-001',
        photoUrl: null,
        enrollments: [
          { section: { name: 'A', class: { grade: 'Grade 8' } } },
        ],
      });
      mockRepository.findSeatingsForStudentInSession.mockResolvedValue([
        {
          seatNumber: '12',
          room: {
            roomId: 'room-master-1',
            schedule: {
              subject: { name: 'Mathematics' },
              date: new Date('2026-09-10'),
              startTime: new Date('2026-09-10T09:00:00'),
              endTime: new Date('2026-09-10T11:00:00'),
            },
          },
        },
      ]);
      mockRepository.findMasterRoomsByIds.mockResolvedValue([
        { id: 'room-master-1', name: 'Hall B' },
      ]);

      const result = await service.getStudentHallTicketData('student-1', 'session-1');

      expect(result.session.name).toBe('Finals');
      expect(result.student.className).toBe('Grade 8 - A');
      expect(result.subjects).toHaveLength(1);
      expect(result.subjects[0]).toMatchObject({
        subject: 'Mathematics',
        roomName: 'Hall B',
        seatNumber: '12',
      });
    });
  });

  describe('renderStudentHallTicketPdf', () => {
    it('renders and uploads the PDF for a valid student/session', async () => {
      mockRepository.findSessionById.mockResolvedValue({ id: 'session-1', name: 'Finals' });
      mockRepository.findStudentForHallTicket.mockResolvedValue({
        id: 'student-1',
        fullName: 'Asha Rao',
        admissionNumber: 'A-001',
        photoUrl: null,
        enrollments: [],
      });
      mockRepository.findSeatingsForStudentInSession.mockResolvedValue([
        {
          seatNumber: '12',
          room: {
            roomId: 'room-master-1',
            schedule: {
              subject: { name: 'Mathematics' },
              date: new Date('2026-09-10'),
              startTime: new Date('2026-09-10T09:00:00'),
              endTime: new Date('2026-09-10T11:00:00'),
            },
          },
        },
      ]);
      mockRepository.findMasterRoomsByIds.mockResolvedValue([
        { id: 'room-master-1', name: 'Hall B' },
      ]);
      mockRenderer.renderHallTicket.mockResolvedValue(Buffer.from('pdf'));
      mockStorage.uploadFile.mockResolvedValue({ url: 'https://storage/hall-ticket.pdf' });

      const result = await service.renderStudentHallTicketPdf('student-1', 'session-1');

      expect(mockRenderer.renderHallTicket).toHaveBeenCalled();
      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'hall-tickets/student-1',
        'hall-ticket-session-1.pdf',
        'application/pdf',
      );
      expect(result).toEqual({ url: 'https://storage/hall-ticket.pdf' });
    });
  });
});
