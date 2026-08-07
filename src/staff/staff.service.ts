import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { resolveSingleCampusIdOrThrow } from '../common/utils/campus-resolution';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStaffDto: CreateStaffDto) {
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

    const campusId =
      createStaffDto.campusId ??
      (await resolveSingleCampusIdOrThrow(this.prisma));

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

  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, totalCount] = await Promise.all([
        this.prisma.staff.findMany({
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
        this.prisma.staff.count(),
      ]);
      return { data, totalCount, page, limit };
    }

    const data = await this.prisma.staff.findMany({
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

  async findOne(id: string) {
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
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    await this.findOne(id); // Throws 404 if not found

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

  async getAttendanceLogs(staffId: string, month?: string) {
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
  ) {
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

  async updateTeacherAssignments(id: string, assignments: any[]) {
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

  async updateTransportAssignments(id: string, assignments: any[]) {
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.staff.delete({
      where: { id },
    });
  }
}
