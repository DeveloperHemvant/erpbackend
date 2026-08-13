import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { TenantContextBuilder } from './tenant-context';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('TenantContextInterceptor', () => {
  const mockBuilder = { build: jest.fn() };
  const interceptor = new TenantContextInterceptor(
    mockBuilder as unknown as TenantContextBuilder,
  );

  const staffUser: AuthenticatedUser = {
    userId: 'staff-1',
    identifier: 'teacher@school.edu',
    role: 'Teacher',
    permissions: [],
    campusId: 'campus-a',
    canAccessAllCampuses: false,
  };

  const makeContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const makeNext = (): CallHandler => ({ handle: () => of('handler-result') });

  beforeEach(() => jest.clearAllMocks());

  it('attaches the built TenantContext to request.tenantContext before calling next.handle()', async () => {
    mockBuilder.build.mockResolvedValue({
      userId: 'staff-1',
      role: 'Teacher',
      permissions: [],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    });
    const request: any = { user: staffUser };

    const result$ = interceptor.intercept(makeContext(request), makeNext());
    const result = await firstValueFrom(result$);

    expect(mockBuilder.build).toHaveBeenCalledWith(staffUser);
    expect(request.tenantContext).toMatchObject({ campusId: 'campus-a' });
    expect(result).toBe('handler-result');
  });
});
