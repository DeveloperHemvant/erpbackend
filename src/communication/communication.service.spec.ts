import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from './communication.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommunicationService', () => {
  let service: CommunicationService;

  const mockPrismaService = {
    portalAccount: {
      findFirst: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('returns an empty list when the referenceId has no portal account', async () => {
      mockPrismaService.portalAccount.findFirst.mockResolvedValue(null);

      const result = await service.getNotifications('no-account-id');

      expect(result).toEqual([]);
      expect(mockPrismaService.notification.findMany).not.toHaveBeenCalled();
    });

    it('looks up notifications by the portal account, newest first', async () => {
      mockPrismaService.portalAccount.findFirst.mockResolvedValue({
        id: 'account-1',
      });
      mockPrismaService.notification.findMany.mockResolvedValue([
        { id: 'n1', readStatus: false },
      ]);

      const result = await service.getNotifications('parent-1');

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: 'account-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'n1', readStatus: false }]);
    });
  });

  describe('markNotificationRead', () => {
    it('sets readStatus true on the given notification id', async () => {
      mockPrismaService.notification.update.mockResolvedValue({
        id: 'n1',
        readStatus: true,
      });

      await service.markNotificationRead('n1');

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readStatus: true },
      });
    });
  });

  describe('markAllNotificationsRead', () => {
    it('returns count 0 without touching notifications when there is no portal account', async () => {
      mockPrismaService.portalAccount.findFirst.mockResolvedValue(null);

      const result = await service.markAllNotificationsRead('no-account-id');

      expect(result).toEqual({ count: 0 });
      expect(mockPrismaService.notification.updateMany).not.toHaveBeenCalled();
    });

    it('marks only that account unread notifications as read', async () => {
      mockPrismaService.portalAccount.findFirst.mockResolvedValue({
        id: 'account-1',
      });
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllNotificationsRead('parent-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'account-1', readStatus: false },
        data: { readStatus: true },
      });
      expect(result).toEqual({ count: 3 });
    });
  });
});
