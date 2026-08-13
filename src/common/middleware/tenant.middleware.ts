import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../../prisma/prisma.service';

// Campus Isolation Phase 2 — this used to read campusId from an
// x-campus-id/campus-id request header, entirely client-supplied and never
// cross-checked against the authenticated user (the actual vulnerability
// this milestone closes). campusId is no longer seeded here at all; it's
// set later, post-JWT-verification, by JwtAuthGuard.handleRequest() from
// the trusted token payload. Public/unauthenticated routes correctly never
// get a campusId in the store — there's no user to scope by.
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    tenantContext.run({ ipAddress, userAgent }, () => {
      next();
    });
  }
}
