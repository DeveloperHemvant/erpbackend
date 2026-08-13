import { Request, Response } from 'express';
import { TenantMiddleware } from './tenant.middleware';
import { tenantContext } from '../../prisma/prisma.service';

describe('TenantMiddleware — Campus Isolation Phase 2', () => {
  const middleware = new TenantMiddleware();

  const makeRequest = (headers: Record<string, string> = {}): Request =>
    ({
      ip: '10.0.0.1',
      headers: { 'user-agent': 'jest', ...headers },
      connection: {},
    }) as unknown as Request;

  it('never seeds campusId into the store, even when a forged header is present', () => {
    const req = makeRequest({ 'x-campus-id': 'attacker-forged-campus' });
    let capturedCampusId: string | undefined = 'unset';

    middleware.use(req, {} as Response, () => {
      capturedCampusId = tenantContext.getStore()?.campusId;
    });

    expect(capturedCampusId).toBeUndefined();
  });

  it('also ignores the legacy campus-id header spelling', () => {
    const req = makeRequest({ 'campus-id': 'attacker-forged-campus' });
    let capturedCampusId: string | undefined = 'unset';

    middleware.use(req, {} as Response, () => {
      capturedCampusId = tenantContext.getStore()?.campusId;
    });

    expect(capturedCampusId).toBeUndefined();
  });

  it('still populates ipAddress/userAgent for audit logging — unaffected by the campusId fix', () => {
    const req = makeRequest();
    let captured: { ipAddress?: string; userAgent?: string } = {};

    middleware.use(req, {} as Response, () => {
      const store = tenantContext.getStore();
      captured = { ipAddress: store?.ipAddress, userAgent: store?.userAgent };
    });

    expect(captured).toEqual({ ipAddress: '10.0.0.1', userAgent: 'jest' });
  });
});
