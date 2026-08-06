import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, url, headers } = request;

    // We only log state changes: POST, PATCH, PUT, DELETE
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Resolve table names & records
    const pathParts = url.split('?')[0].split('/');
    const resource = pathParts.find(
      (p) => p && p !== 'erp-core' && p !== 'api' && p !== 'v1',
    );
    const tableName = resource || 'unknown';
    let recordId = 'n/a';

    // Attempt to extract record ID from request parameters (e.g., /roles/:id)
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(lastPart)) {
      recordId = lastPart;
    }

    // Fetch existing state (oldValue) before operation runs
    let oldValue: any = null;
    if (
      recordId !== 'n/a' &&
      (method === 'PATCH' || method === 'PUT' || method === 'DELETE')
    ) {
      try {
        let modelKey = tableName.toLowerCase();
        if (modelKey.endsWith('s')) {
          modelKey = modelKey.slice(0, -1);
        }
        if (modelKey === 'campuse') modelKey = 'campus';
        if (modelKey === 'invoice') modelKey = 'feeInvoice';
        if (modelKey === 'payment') modelKey = 'feePayment';

        if ((this.prisma as any)[modelKey]) {
          oldValue = await (this.prisma as any)[modelKey].findUnique({
            where: { id: recordId },
          });
        }
      } catch (err) {
        this.logger.warn(
          `Could not fetch old record state for ${tableName}/${recordId}: ${err.message}`,
        );
      }
    }

    // Secure IP Extraction (combating IP spoofing)
    const ipAddress =
      request.ip || request.connection.remoteAddress || '0.0.0.0';
    const userAgent = headers['user-agent'] || 'unknown';

    const userEmail =
      request.user?.identifier || request.user?.userId || 'SYSTEM';

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          void (async () => {
            try {
              // Retrieve new/updated record ID if it was a creation
              let finalRecordId = recordId;
              if (finalRecordId === 'n/a' && responseData?.id) {
                finalRecordId = responseData.id;
              }

              const action = `${method}_${tableName.toUpperCase()}`;

              // Create log entries asynchronously
              await this.prisma.auditLog.create({
                data: {
                  userEmail,
                  action,
                  tableName,
                  recordId: finalRecordId,
                  oldValue: oldValue
                    ? JSON.parse(JSON.stringify(oldValue))
                    : undefined,
                  newValue: responseData
                    ? JSON.parse(JSON.stringify(responseData))
                    : undefined,
                  ipAddress,
                  userAgent,
                },
              });
            } catch (logErr) {
              this.logger.error(
                `Failed to persist audit log: ${logErr.message}`,
              );
            }
          })();
        },
      }),
    );
  }
}
