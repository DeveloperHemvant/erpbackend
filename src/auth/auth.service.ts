import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto as UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(loginDto: LoginDto) {
    let user;
    let roleName;
    let permissions;

    // 1. Check Staff (Admin/Teacher/etc.)
    const staff = await this.prisma.staff.findFirst({
      where: {
        email: { equals: loginDto.identifier.trim(), mode: 'insensitive' },
      },
      include: { role: true },
    });

    if (staff) {
      if (staff.status !== 'Active')
        throw new UnauthorizedException('Account suspended.');
      const isMatch = await bcrypt.compare(
        loginDto.password,
        staff.passwordHash,
      );
      if (!isMatch) throw new UnauthorizedException('Invalid credentials.');

      user = {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        campusId: staff.campusId,
      };
      roleName = staff.role.name;
      permissions = staff.role.permissions;
    } else {
      // 2. Check PortalAccount (Student/Parent)
      const portalUser = await this.prisma.portalAccount.findFirst({
        where: {
          username: { equals: loginDto.identifier.trim(), mode: 'insensitive' },
        },
      });

      if (!portalUser) throw new UnauthorizedException('Invalid credentials.');
      if (portalUser.status !== 'Active')
        throw new UnauthorizedException('Account suspended.');

      const isMatch = await bcrypt.compare(
        loginDto.password,
        portalUser.passwordHash,
      );
      if (!isMatch) throw new UnauthorizedException('Invalid credentials.');

      // Fetch dynamic role for Student/Parent
      const role = await this.prisma.role.findUnique({
        where: {
          name: portalUser.userType === 'STUDENT' ? 'Student' : 'Parent',
        },
      });

      user = {
        id: portalUser.referenceId,
        referenceId: portalUser.referenceId,
        username: portalUser.username,
        userType: portalUser.userType,
        // Never campus-scoped (D2) — a parent's children, or a student's
        // own enrollment, can be at any campus; there is no single
        // well-defined campusId for a portal identity.
        campusId: null,
      };
      roleName = role ? role.name : portalUser.userType;
      permissions = role ? role.permissions : [];
    }

    const canAccessAllCampuses = permissions.includes('*');

    const payload = {
      sub: user.id,
      identifier: loginDto.identifier,
      role: roleName,
      permissions: permissions,
      campusId: user.campusId ?? null,
      canAccessAllCampuses,
    };

    // Log the successful login
    await this.auditLogService.logAction({
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      role: roleName,
      details: { identifier: loginDto.identifier },
    });

    return {
      message: 'Authentication successful',
      token: this.jwtService.sign(payload),
      user: {
        ...user,
        role: roleName,
        permissions: permissions,
      },
    };
  }

  // Re-issues a token for an already-authenticated user, re-reading their
  // role's permissions fresh from the DB instead of reusing the snapshot
  // baked into their current (possibly stale) token. Lets a user pick up a
  // permission change made after they logged in without a full logout —
  // same Staff-then-PortalAccount identity resolution as changePassword.
  async refreshSession(userId: string, identifier: string) {
    let user;
    let roleName;
    let permissions;

    const staff = await this.prisma.staff.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (staff) {
      if (staff.status !== 'Active')
        throw new UnauthorizedException('Account suspended.');
      user = {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        campusId: staff.campusId,
      };
      roleName = staff.role.name;
      permissions = staff.role.permissions;
    } else {
      const portalUser = await this.prisma.portalAccount.findFirst({
        where: { referenceId: userId },
      });
      if (!portalUser) throw new NotFoundException('Account not found.');
      if (portalUser.status !== 'Active')
        throw new UnauthorizedException('Account suspended.');

      const role = await this.prisma.role.findUnique({
        where: {
          name: portalUser.userType === 'STUDENT' ? 'Student' : 'Parent',
        },
      });

      user = {
        id: portalUser.referenceId,
        referenceId: portalUser.referenceId,
        username: portalUser.username,
        userType: portalUser.userType,
        campusId: null,
      };
      roleName = role ? role.name : portalUser.userType;
      permissions = role ? role.permissions : [];
    }

    const canAccessAllCampuses = permissions.includes('*');

    const payload = {
      sub: user.id,
      identifier,
      role: roleName,
      permissions,
      campusId: user.campusId ?? null,
      canAccessAllCampuses,
    };

    return {
      message: 'Session refreshed',
      token: this.jwtService.sign(payload),
      user: {
        ...user,
        role: roleName,
        permissions,
      },
    };
  }

  // JWT `sub`/`userId` is a Staff id for staff logins, or the Student/Parent's
  // own id (PortalAccount.referenceId) for portal logins — never the
  // PortalAccount row's own id — so we try Staff first, then fall back.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const staff = await this.prisma.staff.findUnique({ where: { id: userId } });
    if (staff) {
      const isMatch = await bcrypt.compare(
        dto.currentPassword,
        staff.passwordHash,
      );
      if (!isMatch)
        throw new UnauthorizedException('Current password is incorrect.');
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.staff.update({
        where: { id: userId },
        data: { passwordHash },
      });
      return { success: true };
    }

    const portalAccount = await this.prisma.portalAccount.findFirst({
      where: { referenceId: userId },
    });
    if (portalAccount) {
      const isMatch = await bcrypt.compare(
        dto.currentPassword,
        portalAccount.passwordHash,
      );
      if (!isMatch)
        throw new UnauthorizedException('Current password is incorrect.');
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.portalAccount.update({
        where: { id: portalAccount.id },
        data: { passwordHash },
      });
      return { success: true };
    }

    throw new NotFoundException('Account not found.');
  }

  // System Settings (web-app dashboard) is staff-only, so this only covers
  // Staff — same identity-resolution note as changePassword above.
  async getMyProfile(userId: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id: userId } });
    if (!staff) throw new NotFoundException('Account not found.');
    const details = (staff.details as Record<string, any>) || {};
    return {
      fullName: staff.fullName,
      email: staff.email,
      notificationPreferences: {
        smsAlerts: details.notificationPreferences?.smsAlerts ?? true,
        dailyDigest: details.notificationPreferences?.dailyDigest ?? true,
      },
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const staff = await this.prisma.staff.findUnique({ where: { id: userId } });
    if (!staff) throw new NotFoundException('Account not found.');

    const details = (staff.details as Record<string, any>) || {};
    const updated = await this.prisma.staff.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.notificationPreferences !== undefined && {
          details: {
            ...details,
            notificationPreferences: {
              ...details.notificationPreferences,
              ...dto.notificationPreferences,
            },
          },
        }),
      },
    });

    const updatedDetails = (updated.details as Record<string, any>) || {};
    return {
      fullName: updated.fullName,
      email: updated.email,
      notificationPreferences: {
        smsAlerts: updatedDetails.notificationPreferences?.smsAlerts ?? true,
        dailyDigest: updatedDetails.notificationPreferences?.dailyDigest ?? true,
      },
    };
  }
}
