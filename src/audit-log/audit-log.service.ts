import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(data: {
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    performedBy: string;
    role: string;
    details?: any;
    ipAddress?: string;
    deviceInfo?: string;
  }) {
    return this.prisma.systemAuditLog.create({
      data: {
        ...data,
        details: data.details || {},
      },
    });
  }

  async getLogs() {
    const sysLogs = await this.prisma.systemAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit for performance
    });

    const globalLogs = await this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    const mappedGlobalLogs = globalLogs.map(l => ({
      id: l.id,
      action: l.action,
      module: l.tableName,
      entityType: l.tableName,
      entityId: l.recordId,
      performedBy: l.userEmail || 'SYSTEM',
      role: 'SYSTEM',
      details: {
        oldValue: l.oldValue,
        newValue: l.newValue
      },
      ipAddress: l.ipAddress,
      deviceInfo: l.userAgent,
      timestamp: l.timestamp
    }));

    return [...sysLogs, ...mappedGlobalLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
