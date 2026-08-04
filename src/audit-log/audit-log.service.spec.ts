import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  const mockPrismaService = {
    systemAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLogs', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('merges systemAuditLog and auditLog rows sorted by timestamp, newest first', async () => {
      mockPrismaService.systemAuditLog.findMany.mockResolvedValue([
        { id: 'sys-1', action: 'CREATE', module: 'fees', timestamp: new Date('2026-08-02T10:00:00Z') },
      ]);
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        {
          id: 'glob-1',
          action: 'UPDATE',
          tableName: 'students',
          recordId: 'rec-1',
          userEmail: 'admin@school.test',
          oldValue: { a: 1 },
          newValue: { a: 2 },
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
          timestamp: new Date('2026-08-03T10:00:00Z'),
        },
      ]);

      const result = await service.getLogs();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('glob-1'); // newer global log sorts first
      expect(result.data[0].module).toBe('students'); // tableName mapped to module
      expect(result.data[0].performedBy).toBe('admin@school.test');
      expect(result.data[1].id).toBe('sys-1');
      expect(result.total).toBe(2);
    });

    it('falls back to SYSTEM as performedBy when the global log has no userEmail', async () => {
      mockPrismaService.systemAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        { id: 'glob-1', action: 'DELETE', tableName: 'fees', recordId: 'r1', userEmail: null, timestamp: new Date() },
      ]);

      const result = await service.getLogs();

      expect(result.data[0].performedBy).toBe('SYSTEM');
    });

    it('paginates the merged, sorted result instead of returning everything', async () => {
      const sysLogs = Array.from({ length: 5 }, (_, i) => ({
        id: `sys-${i}`,
        action: 'CREATE',
        module: 'fees',
        timestamp: new Date(2026, 0, i + 1),
      }));
      mockPrismaService.systemAuditLog.findMany.mockResolvedValue(sysLogs);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      const page1 = await service.getLogs({ page: 1, pageSize: 2 });
      const page2 = await service.getLogs({ page: 2, pageSize: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.totalPages).toBe(3);
      // newest first: sys-4 (Jan 5) then sys-3 (Jan 4) on page 1
      expect(page1.data[0].id).toBe('sys-4');
      expect(page2.data[0].id).toBe('sys-2');
    });

    it('passes module/action/date filters through to both underlying queries', async () => {
      mockPrismaService.systemAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getLogs({ module: 'fees', action: 'CREATE', from: '2026-01-01', to: '2026-01-31' });

      expect(mockPrismaService.systemAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            module: 'fees',
            action: { contains: 'CREATE', mode: 'insensitive' },
            timestamp: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          }),
        }),
      );
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tableName: 'fees',
            action: { contains: 'CREATE', mode: 'insensitive' },
          }),
        }),
      );
    });
  });
});
