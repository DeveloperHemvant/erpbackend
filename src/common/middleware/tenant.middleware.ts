import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const campusId =
      (req.headers['x-campus-id'] as string) ||
      (req.headers['campus-id'] as string) ||
      undefined;
    tenantContext.run({ ipAddress, userAgent, campusId }, () => {
      next();
    });
  }
}
