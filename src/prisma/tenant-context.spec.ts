import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextBuilder } from './tenant-context';
import { PrismaService } from './prisma.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('TenantContextBuilder', () => {
  let builder: TenantContextBuilder;

  const mockPrisma = {
    academicSession: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextBuilder,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    builder = module.get<TenantContextBuilder>(TenantContextBuilder);
  });

  const staffUser: AuthenticatedUser = {
    userId: 'staff-1',
    identifier: 'teacher@school.edu',
    role: 'Teacher',
    permissions: ['VIEW_STUDENTS'],
    campusId: 'campus-a',
    canAccessAllCampuses: false,
  };

  it('assembles all five fields, resolving academicSessionId from the active session', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue({ id: 'session-1' });

    const result = await builder.build(staffUser);

    expect(result).toEqual({
      userId: 'staff-1',
      role: 'Teacher',
      permissions: ['VIEW_STUDENTS'],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
      academicSessionId: 'session-1',
    });
    expect(mockPrisma.academicSession.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { id: true },
    });
  });

  it('resolves academicSessionId to null when no session is currently active', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue(null);

    const result = await builder.build(staffUser);

    expect(result.academicSessionId).toBeNull();
  });

  it('carries campusId: null through unchanged for a canAccessAllCampuses user', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue({ id: 'session-1' });
    const superAdmin: AuthenticatedUser = {
      userId: 'admin-1',
      identifier: 'admin@school.edu',
      role: 'Super Admin',
      permissions: ['*'],
      campusId: null,
      canAccessAllCampuses: true,
    };

    const result = await builder.build(superAdmin);

    expect(result.campusId).toBeNull();
    expect(result.canAccessAllCampuses).toBe(true);
  });
});
