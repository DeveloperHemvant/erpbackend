import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StorageService } from '../storage/storage.service';
import type { TenantContext } from '../prisma/tenant-context';
import { requireCampusId } from '../prisma/tenant-context';
import * as bcrypt from 'bcrypt';

function campusFilter(tenantContext: TenantContext): { campusId: string } | {} {
  return tenantContext.canAccessAllCampuses
    ? {}
    : { campusId: requireCampusId(tenantContext) };
}

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(createStaffDto: CreateStaffDto, tenantContext: TenantContext) {
    // Verify email uniqueness
    const existing = await this.prisma.staff.findUnique({
      where: { email: createStaffDto.email },
    });
    if (existing) {
      throw new ConflictException(
        `Staff user with email "${createStaffDto.email}" already exists.`,
      );
    }

    // Verify role mapping exists
    const role = await this.prisma.role.findUnique({
      where: { id: createStaffDto.roleId },
    });
    if (!role) {
      throw new NotFoundException(
        `Associated Role with ID "${createStaffDto.roleId}" not found.`,
      );
    }

    // Generate password if not provided
    const generatedPassword =
      createStaffDto.passwordHash ||
      `Staff@${Math.floor(1000 + Math.random() * 9000)}`;

    // Hash Password securely
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(generatedPassword, saltRounds);

    // Campus Isolation Phase 3, Milestone 5 — campusId no longer falls back
    // to resolveSingleCampusIdOrThrow's "exactly one campus exists" shim.
    // Restricted callers default to their own campus and can't onboard
    // staff directly into a different one; unrestricted (HQ) callers must
    // say explicitly which campus, since there's no ambient default for
    // them (D3 — never silently guess).
    let campusId: string;
    if (tenantContext.canAccessAllCampuses) {
      if (!createStaffDto.campusId) {
        throw new BadRequestException(
          'campusId is required when creating staff as a cross-campus admin — there is no default campus to assume.',
        );
      }
      campusId = createStaffDto.campusId;
    } else {
      const ownCampusId = requireCampusId(tenantContext);
      if (createStaffDto.campusId && createStaffDto.campusId !== ownCampusId) {
        throw new ForbiddenException(
          'Cannot onboard staff into a different campus than your own.',
        );
      }
      campusId = ownCampusId;
    }

    const staff = await this.prisma.staff.create({
      data: {
        email: createStaffDto.email,
        fullName: createStaffDto.fullName,
        passwordHash,
        roleId: createStaffDto.roleId,
        status: createStaffDto.status || 'Active',
        details: createStaffDto.details || undefined,
        createdBy: createStaffDto.createdBy || 'SYSTEM',
        campusId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return { ...staff, generatedPassword };
  }

  async findAll(tenantContext: TenantContext, page?: number, limit?: number) {
    const where = campusFilter(tenantContext);
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, totalCount] = await Promise.all([
        this.prisma.staff.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            fullName: true,
            status: true,
            photoUrl: true,
            role: { select: { id: true, name: true } },
            createdAt: true,
          },
          orderBy: { fullName: 'asc' },
        }),
        this.prisma.staff.count({ where }),
      ]);
      return { data, totalCount, page, limit };
    }

    const data = await this.prisma.staff.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        photoUrl: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return { data, totalCount: data.length, page: 1, limit: data.length };
  }

  // Campus Isolation Phase 3, Milestone 5 — cross-tenant direct-by-id access
  // throws the SAME NotFoundException a genuinely-missing id already throws,
  // not a new 403 branch: don't confirm a record exists in a campus the
  // caller can't see. Self-access always passes for free (a staff member's
  // own record trivially has their own campusId).
  private assertAccessible(
    staff: { campusId: string },
    tenantContext: TenantContext,
    id: string,
  ) {
    if (
      !tenantContext.canAccessAllCampuses &&
      staff.campusId !== tenantContext.campusId
    ) {
      throw new NotFoundException(`Staff record with ID "${id}" not found.`);
    }
  }

  async findOne(id: string, tenantContext: TenantContext) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        gender: true,
        education: true,
        experience: true,
        photoUrl: true,
        details: true,
        roleId: true,
        campusId: true,
        role: { select: { id: true, name: true, permissions: true } },
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        assignments: {
          include: {
            subject: true,
            section: {
              include: { class: true },
            },
          },
        },
        transportAssignments: {
          include: {
            vehicle: true,
          },
        },
        TransportTrip: {
          include: {
            route: true,
            vehicle: true,
          },
        },
      },
    });
    if (!staff) {
      throw new NotFoundException(`Staff record with ID "${id}" not found.`);
    }
    this.assertAccessible(staff, tenantContext, id);
    return staff;
  }

  async update(
    id: string,
    updateStaffDto: UpdateStaffDto,
    tenantContext: TenantContext,
  ) {
    await this.findOne(id, tenantContext); // Throws 404 if not found or not accessible

    if (updateStaffDto.email) {
      const existing = await this.prisma.staff.findFirst({
        where: {
          email: updateStaffDto.email,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Another staff record with email "${updateStaffDto.email}" already exists.`,
        );
      }
    }

    let passwordHash: string | undefined = undefined;
    if (updateStaffDto.passwordHash) {
      const saltRounds = 12;
      passwordHash = await bcrypt.hash(updateStaffDto.passwordHash, saltRounds);
    }

    if (updateStaffDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateStaffDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID "${updateStaffDto.roleId}" not found.`,
        );
      }
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        email: updateStaffDto.email,
        fullName: updateStaffDto.fullName,
        passwordHash,
        roleId: updateStaffDto.roleId,
        status: updateStaffDto.status,
        gender: (updateStaffDto as any).gender,
        education: (updateStaffDto as any).education,
        experience: (updateStaffDto as any).experience,
        photoUrl: (updateStaffDto as any).photoUrl,
        details: (updateStaffDto as any).details,
        updatedBy: updateStaffDto.updatedBy || 'SYSTEM',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        role: { select: { id: true, name: true } },
        updatedAt: true,
      },
    });

    // Try updating portal account if it exists for this staff member
    if (updateStaffDto.email || passwordHash) {
      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: id, userType: 'STAFF' },
      });
      if (portalAccount) {
        const portalUpdateData: any = {};
        if (updateStaffDto.email)
          portalUpdateData.username = updateStaffDto.email;
        if (passwordHash) portalUpdateData.passwordHash = passwordHash;
        await this.prisma.portalAccount.update({
          where: { id: portalAccount.id },
          data: portalUpdateData,
        });
      }
    }

    return updated;
  }

  async assignTransport(staffId: string, vehicleId: string, routeType: string) {
    // Delete any existing assignments for this shift (routeType)
    await this.prisma.transportVehicleStaff.deleteMany({
      where: { staffId, shift: routeType },
    });

    return this.prisma.transportVehicleStaff.create({
      data: { staffId, vehicleId, shift: routeType },
    });
  }

  // Campus Isolation Phase 3, Milestone 5 — found, not fixed here: staffId
  // comes from the request body/route param, not @CurrentUser(), so any
  // authenticated staff member can currently mark/read another staffId's
  // attendance. That's a pre-existing authorization gap unrelated to campus
  // isolation (identical bug regardless of campus count) — out of scope for
  // this milestone, flagged for a future auth-hardening pass.
  async getSelfAttendance(staffId: string, dateStr?: string) {
    const queryDate = dateStr
      ? dateStr.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        staffId,
        date: queryDate,
      },
    });
    return record || { status: 'PENDING' };
  }

  async markSelfAttendance(data: {
    staffId: string;
    status: string;
    date: string;
  }) {
    const dateStr = data.date.split('T')[0]; // Ensure YYYY-MM-DD
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const isCheckOut = data.status === 'CHECKED_OUT';

    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        staffId: data.staffId,
        date: dateStr,
      },
    });

    if (existing) {
      return this.prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          updatedBy: data.staffId,
          checkInTime:
            existing.checkInTime ?? (isCheckOut ? undefined : nowTime),
          checkOutTime: isCheckOut ? nowTime : existing.checkOutTime,
        },
      });
    }

    return this.prisma.attendanceRecord.create({
      data: {
        staffId: data.staffId,
        date: dateStr,
        status: data.status,
        createdBy: data.staffId,
        checkInTime: isCheckOut ? undefined : nowTime,
        checkOutTime: isCheckOut ? nowTime : undefined,
      },
    });
  }

  // Shared by every method below that mutates/reads a specific staffId
  // without already going through findOne()'s full fetch — cheap lookup of
  // just campusId, same 404-on-mismatch behavior.
  private async assertStaffAccessibleById(
    id: string,
    tenantContext: TenantContext,
  ) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: { campusId: true },
    });
    if (!staff) {
      throw new NotFoundException(`Staff record with ID "${id}" not found.`);
    }
    this.assertAccessible(staff, tenantContext, id);
  }

  async getAttendanceLogs(
    staffId: string,
    tenantContext: TenantContext,
    month?: string,
  ) {
    await this.assertStaffAccessibleById(staffId, tenantContext);
    if (month) {
      return this.prisma.attendanceRecord.findMany({
        where: { staffId, date: { startsWith: month } },
        orderBy: { date: 'desc' },
      });
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return this.prisma.attendanceRecord.findMany({
        where: {
          staffId,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { date: 'desc' },
      });
    }
  }

  async applyLeave(
    staffId: string,
    data: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
    },
    tenantContext: TenantContext,
  ) {
    await this.assertStaffAccessibleById(staffId, tenantContext);
    return this.prisma.leaveApplication.create({
      data: {
        staffId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      },
    });
  }

  async updateTeacherAssignments(
    id: string,
    assignments: any[],
    tenantContext: TenantContext,
  ) {
    await this.assertStaffAccessibleById(id, tenantContext);
    // Delete existing
    await this.prisma.teacherAssignment.deleteMany({ where: { staffId: id } });

    // Create new
    if (assignments && assignments.length > 0) {
      // Find the active session
      let activeSession = await this.prisma.academicSession.findFirst({
        where: { isActive: true },
      });
      if (!activeSession)
        activeSession = await this.prisma.academicSession.findFirst();
      if (!activeSession)
        throw new NotFoundException('No academic session found in database');

      const dataToInsert = assignments.map((a) => ({
        staffId: id,
        sessionId: activeSession.id,
        sectionId: a.sectionId || null,
        subjectId: a.subjectId || null,
        isClassTeacher: a.isClassTeacher || false,
      }));

      await this.prisma.teacherAssignment.createMany({ data: dataToInsert });
    }
    return { success: true };
  }

  async updateTransportAssignments(
    id: string,
    assignments: any[],
    tenantContext: TenantContext,
  ) {
    await this.assertStaffAccessibleById(id, tenantContext);
    // We only support creating one vehicle staff relation and one trip for now per submission
    // First clear existing if they want a clean slate, or just append.
    // The user wants to "assign their bus with bus route". Let's clear and re-assign.
    await this.prisma.transportVehicleStaff.deleteMany({
      where: { staffId: id },
    });
    await this.prisma.transportTrip.deleteMany({
      where: { driverId: id, status: 'Scheduled' },
    });

    if (assignments && assignments.length > 0) {
      for (const a of assignments) {
        if (a.vehicleId) {
          await this.prisma.transportVehicleStaff.create({
            data: {
              staffId: id,
              vehicleId: a.vehicleId,
              shift: a.shift || 'Full Day',
              status: 'Assigned',
            },
          });
        }

        if (a.routeId && a.vehicleId) {
          await this.prisma.transportTrip.create({
            data: {
              driverId: id,
              vehicleId: a.vehicleId,
              routeId: a.routeId,
              tripType: a.tripType || 'Morning',
              date: new Date().toISOString().split('T')[0], // Assign for today/future
              status: 'Scheduled',
            },
          });
        }
      }
    }
    return { success: true };
  }

  async remove(id: string, tenantContext: TenantContext) {
    await this.findOne(id, tenantContext);
    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async uploadPhoto(
    id: string,
    file: { originalname: string; buffer: Buffer; mimetype?: string },
    tenantContext: TenantContext,
  ) {
    await this.findOne(id, tenantContext);
    const { url } = await this.storage.uploadFile(
      file.buffer,
      `staff/${id}`,
      file.originalname,
      file.mimetype,
    );
    await this.prisma.staff.update({
      where: { id },
      data: { photoUrl: url },
    });
    return { url };
  }
}
