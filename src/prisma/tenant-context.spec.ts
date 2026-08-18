import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextBuilder } from './tenant-context';
import { PrismaService } from './prisma.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('TenantContextBuilder', () => {
  let builder: TenantContextBuilder;

  const mockPrisma = {
    academicSession: { findFirst: jest.fn() },
    campus: { findUnique: jest.fn() },
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

  const superAdmin: AuthenticatedUser = {
    userId: 'admin-1',
    identifier: 'admin@school.edu',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
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

    const result = await builder.build(superAdmin);

    expect(result.campusId).toBeNull();
    expect(result.canAccessAllCampuses).toBe(true);
  });

  it('ignores a requested campus narrowing for a campus-fixed user', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue({ id: 'session-1' });

    const result = await builder.build(staffUser, 'campus-b');

    expect(result.campusId).toBe('campus-a');
    expect(result.canAccessAllCampuses).toBe(false);
    expect(mockPrisma.campus.findUnique).not.toHaveBeenCalled();
  });

  it('presents a canAccessAllCampuses user as campus-restricted once they narrow to a real campus', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue({ id: 'session-1' });
    mockPrisma.campus.findUnique.mockResolvedValue({ id: 'campus-b' });

    const result = await builder.build(superAdmin, 'campus-b');

    expect(result.campusId).toBe('campus-b');
    expect(result.canAccessAllCampuses).toBe(false);
    expect(mockPrisma.campus.findUnique).toHaveBeenCalledWith({
      where: { id: 'campus-b' },
      select: { id: true },
    });
  });

  it('falls back to unrestricted (all campuses) when the requested campus id does not exist', async () => {
    mockPrisma.academicSession.findFirst.mockResolvedValue({ id: 'session-1' });
    mockPrisma.campus.findUnique.mockResolvedValue(null);

    const result = await builder.build(superAdmin, 'nonexistent-campus');

    expect(result.campusId).toBeNull();
    expect(result.canAccessAllCampuses).toBe(true);
  });
});
