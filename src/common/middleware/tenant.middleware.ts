import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip || req.connection.remoteAddress || "0.0.0.0";
    const userAgent = req.headers["user-agent"] || "unknown";
    tenantContext.run({ ipAddress, userAgent }, () => {
      next();
    });
  }
}
