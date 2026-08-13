import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('AuthService — login (Campus Isolation Phase 1)', () => {
  let service: AuthService;

  const mockPrisma = {
    staff: { findFirst: jest.fn() },
    portalAccount: { findFirst: jest.fn() },
    role: { findUnique: jest.fn() },
  };
  const mockJwt = { sign: jest.fn() };
  const mockAuditLog = { logAction: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuditLog.logAction.mockResolvedValue(undefined);
    mockJwt.sign.mockReturnValue('signed.jwt.token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Staff login', () => {
    it('carries the staff member\'s campusId and canAccessAllCampuses:false onto the JWT payload and response user', async () => {
      const passwordHash = await bcrypt.hash('secret', 10);
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'staff-1',
        email: 'teacher@school.edu',
        fullName: 'Test Teacher',
        passwordHash,
        status: 'Active',
        campusId: 'campus-a',
        role: { name: 'Teacher', permissions: ['VIEW_STUDENTS'] },
      });

      const result = await service.login({
        identifier: 'teacher@school.edu',
        password: 'secret',
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          campusId: 'campus-a',
          canAccessAllCampuses: false,
        }),
      );
      expect(result.user).toMatchObject({ campusId: 'campus-a' });
    });

    it('derives canAccessAllCampuses:true from a wildcard permission (Super Admin/Principal)', async () => {
      const passwordHash = await bcrypt.hash('secret', 10);
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@school.edu',
        fullName: 'Test Admin',
        passwordHash,
        status: 'Active',
        campusId: 'campus-a',
        role: { name: 'Super Admin', permissions: ['*'] },
      });

      await service.login({ identifier: 'admin@school.edu', password: 'secret' });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ canAccessAllCampuses: true }),
      );
    });

    it('rejects an incorrect password before ever building a payload', async () => {
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'staff-1',
        email: 'teacher@school.edu',
        passwordHash: await bcrypt.hash('correct', 10),
        status: 'Active',
        campusId: 'campus-a',
        role: { name: 'Teacher', permissions: [] },
      });

      await expect(
        service.login({ identifier: 'teacher@school.edu', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('Portal (Student/Parent) login', () => {
    it('never puts a campusId on the JWT payload, per D2', async () => {
      const passwordHash = await bcrypt.hash('secret', 10);
      mockPrisma.staff.findFirst.mockResolvedValue(null);
      mockPrisma.portalAccount.findFirst.mockResolvedValue({
        id: 'portal-1',
        username: 'student01',
        passwordHash,
        status: 'Active',
        userType: 'STUDENT',
        referenceId: 'student-1',
      });
      mockPrisma.role.findUnique.mockResolvedValue({
        name: 'Student',
        permissions: ['VIEW_OWN_PROFILE'],
      });

      const result = await service.login({ identifier: 'student01', password: 'secret' });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: null, canAccessAllCampuses: false }),
      );
      expect(result.user).toMatchObject({ campusId: null });
    });

    it('a Parent login also gets campusId: null even with a wildcard-free permission set', async () => {
      const passwordHash = await bcrypt.hash('secret', 10);
      mockPrisma.staff.findFirst.mockResolvedValue(null);
      mockPrisma.portalAccount.findFirst.mockResolvedValue({
        id: 'portal-2',
        username: 'parent01',
        passwordHash,
        status: 'Active',
        userType: 'PARENT',
        referenceId: 'parent-1',
      });
      mockPrisma.role.findUnique.mockResolvedValue({
        name: 'Parent',
        permissions: ['VIEW_CHILD_PROFILE'],
      });

      await service.login({ identifier: 'parent01', password: 'secret' });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: null }),
      );
    });
  });
});
