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

  async getLogs(filters: {
    search?: string;
    module?: string;
    action?: string;
    performedBy?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { search, module, action, performedBy, from, to } = filters;
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 25));

    const timestamp = (from || to)
      ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
      : undefined;

    // Pull a generous, filtered window from each source table, then merge in memory —
    // the two tables can't be paginated as a single SQL query since they're separate
    // models with different columns. HARD_CAP bounds worst-case cost on an unfiltered query.
    const HARD_CAP = 1000;

    const sysLogs = await this.prisma.systemAuditLog.findMany({
      where: {
        module: module || undefined,
        action: action ? { contains: action, mode: 'insensitive' } : undefined,
        performedBy: performedBy ? { contains: performedBy, mode: 'insensitive' } : undefined,
        timestamp,
        ...(search
          ? {
              OR: [
                { module: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { performedBy: { contains: search, mode: 'insensitive' } },
                { role: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: HARD_CAP,
    });

    const globalLogs = await this.prisma.auditLog.findMany({
      where: {
        tableName: module || undefined,
        action: action ? { contains: action, mode: 'insensitive' } : undefined,
        userEmail: performedBy ? { contains: performedBy, mode: 'insensitive' } : undefined,
        timestamp,
        ...(search
          ? {
              OR: [
                { tableName: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { userEmail: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: HARD_CAP,
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

    const merged = [...sysLogs, ...mappedGlobalLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = merged.length;
    const start = (page - 1) * pageSize;
    const data = merged.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}
