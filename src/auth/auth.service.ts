import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { AuditLogService } from "../audit-log/audit-log.service";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService
  ) {}

  async login(loginDto: LoginDto) {
    let user;
    let roleName;
    let permissions;

    // 1. Check Staff (Admin/Teacher/etc.)
    const staff = await this.prisma.staff.findFirst({
      where: { email: { equals: loginDto.identifier.trim(), mode: 'insensitive' } },
      include: { role: true },
    });

    if (staff) {
      if (staff.status !== "Active") throw new UnauthorizedException("Account suspended.");
      const isMatch = await bcrypt.compare(loginDto.password, staff.passwordHash);
      if (!isMatch) throw new UnauthorizedException("Invalid credentials.");
      
      user = { id: staff.id, email: staff.email, fullName: staff.fullName };
      roleName = staff.role.name;
      permissions = staff.role.permissions;
    } else {
      // 2. Check PortalAccount (Student/Parent)
      const portalUser = await this.prisma.portalAccount.findFirst({
        where: { username: { equals: loginDto.identifier.trim(), mode: 'insensitive' } }
      });

      if (!portalUser) throw new UnauthorizedException("Invalid credentials.");
      if (portalUser.status !== "Active") throw new UnauthorizedException("Account suspended.");
      
      const isMatch = await bcrypt.compare(loginDto.password, portalUser.passwordHash);
      if (!isMatch) throw new UnauthorizedException("Invalid credentials.");

      // Fetch dynamic role for Student/Parent
      const role = await this.prisma.role.findUnique({
        where: { name: portalUser.userType === "STUDENT" ? "Student" : "Parent" }
      });

      user = { id: portalUser.referenceId, referenceId: portalUser.referenceId, username: portalUser.username, userType: portalUser.userType };
      roleName = role ? role.name : portalUser.userType;
      permissions = role ? role.permissions : [];
    }

    const payload = { 
      sub: user.id, 
      identifier: loginDto.identifier, 
      role: roleName,
      permissions: permissions
    };

    // Log the successful login
    await this.auditLogService.logAction({
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      role: roleName,
      details: { identifier: loginDto.identifier }
    });

    return {
      message: "Authentication successful",
      token: this.jwtService.sign(payload),
      user: {
        ...user,
        role: roleName,
        permissions: permissions,
      },
    };
  }

  // JWT `sub`/`userId` is a Staff id for staff logins, or the Student/Parent's
  // own id (PortalAccount.referenceId) for portal logins — never the
  // PortalAccount row's own id — so we try Staff first, then fall back.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const staff = await this.prisma.staff.findUnique({ where: { id: userId } });
    if (staff) {
      const isMatch = await bcrypt.compare(dto.currentPassword, staff.passwordHash);
      if (!isMatch) throw new UnauthorizedException("Current password is incorrect.");
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.staff.update({ where: { id: userId }, data: { passwordHash } });
      return { success: true };
    }

    const portalAccount = await this.prisma.portalAccount.findFirst({ where: { referenceId: userId } });
    if (portalAccount) {
      const isMatch = await bcrypt.compare(dto.currentPassword, portalAccount.passwordHash);
      if (!isMatch) throw new UnauthorizedException("Current password is incorrect.");
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.portalAccount.update({ where: { id: portalAccount.id }, data: { passwordHash } });
      return { success: true };
    }

    throw new NotFoundException("Account not found.");
  }
}
