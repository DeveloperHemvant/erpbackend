import { ExecutionContext } from '@nestjs/common';
import { TenantAwareCacheInterceptor } from './tenant-aware-cache.interceptor';
import type { TenantContext } from '../prisma/tenant-context';

describe('TenantAwareCacheInterceptor', () => {
  const mockReflector = { get: jest.fn() };
  const mockCacheManager = {};

  const makeInterceptor = () => {
    const interceptor = new TenantAwareCacheInterceptor(
      mockCacheManager as any,
      mockReflector as any,
    );
    // httpAdapterHost is an @Optional() @Inject() property on the base
    // CacheInterceptor, not constructor-injected — set it directly the way
    // Nest's DI would, just enough that trackBy()'s base implementation
    // doesn't throw reading `.httpAdapter` off `undefined`.
    (interceptor as any).httpAdapterHost = {};
    return interceptor;
  };

  const makeContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('appends the campusId to the base @CacheKey() for a campus-restricted caller', async () => {
    mockReflector.get.mockReturnValue('dashboard_finance_summary');
    const interceptor = makeInterceptor();
    const tenantContext: TenantContext = {
      userId: 'staff-1',
      role: 'Teacher',
      permissions: [],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    };

    const key = await interceptor.trackBy(makeContext({ tenantContext }));

    expect(key).toBe('dashboard_finance_summary:campus-a');
  });

  it('appends "all" for a canAccessAllCampuses caller', async () => {
    mockReflector.get.mockReturnValue('dashboard_finance_summary');
    const interceptor = makeInterceptor();
    const tenantContext: TenantContext = {
      userId: 'admin-1',
      role: 'Super Admin',
      permissions: ['*'],
      campusId: null,
      canAccessAllCampuses: true,
      academicSessionId: 'session-1',
    };

    const key = await interceptor.trackBy(makeContext({ tenantContext }));

    expect(key).toBe('dashboard_finance_summary:all');
  });

  it('two different campuses produce two different cache keys — the actual bug this fixes', async () => {
    mockReflector.get.mockReturnValue('dashboard_finance_summary');
    const interceptor = makeInterceptor();

    const keyA = await interceptor.trackBy(
      makeContext({
        tenantContext: { campusId: 'campus-a', canAccessAllCampuses: false },
      }),
    );
    const keyB = await interceptor.trackBy(
      makeContext({
        tenantContext: { campusId: 'campus-b', canAccessAllCampuses: false },
      }),
    );

    expect(keyA).not.toBe(keyB);
  });

  it('appends "no-tenant" when the interceptor pair was not applied to this route (defensive, not the expected path)', async () => {
    mockReflector.get.mockReturnValue('dashboard_finance_summary');
    const interceptor = makeInterceptor();

    const key = await interceptor.trackBy(makeContext({}));

    expect(key).toBe('dashboard_finance_summary:no-tenant');
  });

  it('returns undefined (meaning "do not cache") when there is no @CacheKey() at all, same as the base class', async () => {
    mockReflector.get.mockReturnValue(undefined);
    const interceptor = makeInterceptor();

    const key = await interceptor.trackBy(makeContext({}));

    expect(key).toBeUndefined();
  });
});
