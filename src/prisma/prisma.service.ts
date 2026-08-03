import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  campusId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();

    this.$use(async (params, next) => {
      const context = tenantContext.getStore();
      const campusId = context?.campusId;
      const userEmail = context?.userEmail || 'SYSTEM';
      const ipAddress = context?.ipAddress || '0.0.0.0';
      const userAgent = context?.userAgent || 'unknown';

      // Tenant Scoping
      const modelsWithCampusId = ['StudentEnrollment', 'FeeInvoice', 'AttendanceRecord', 'Class'];
      if (campusId && modelsWithCampusId.includes(params.model as string)) {
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          params.args.where = { ...params.args.where, campusId };
        } else if (params.action === 'updateMany' || params.action === 'deleteMany') {
          params.args.where = { ...params.args.where, campusId };
        } else if (params.action === 'create' || params.action === 'createMany') {
          if (params.args.data) {
            if (Array.isArray(params.args.data)) {
              params.args.data = params.args.data.map((d: any) => ({ ...d, campusId }));
            } else {
              params.args.data = { ...params.args.data, campusId };
            }
          }
        }
      }

      // Global Audit Logging
      const mutatingOps = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
      if (params.model !== 'AuditLog' && mutatingOps.includes(params.action)) {
        let oldValue: any = undefined;

        if ((params.action === 'update' || params.action === 'delete') && params.args.where) {
          try {
            oldValue = await (this as any)[params.model as string].findUnique({ where: params.args.where });
          } catch (e) {}
        }

        const result = await next(params);

        // Asynchronously write log
        Promise.resolve().then(async () => {
          try {
            let recordId = 'n/a';
            if (result && (result as any).id) {
              recordId = (result as any).id;
            } else if (params.args.where && params.args.where.id) {
              recordId = params.args.where.id;
            }

            await this.auditLog.create({
              data: {
                userEmail,
                action: String(params.action).toUpperCase(),
                tableName: params.model as string,
                recordId: String(recordId),
                oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
                newValue: result ? JSON.parse(JSON.stringify(result)) : undefined,
                ipAddress,
                userAgent
              }
            });
          } catch (err) {
            console.error(`Audit log failed: ${err}`);
          }
        });

        return result;
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
