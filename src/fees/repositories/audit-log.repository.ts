import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ErpCoreAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 200,
    });
  }
}
