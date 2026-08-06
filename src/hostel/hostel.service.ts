import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHostelDto,
  AddHostelRoomDto,
  CreateMessMenuDto,
  MarkHostelAttendanceDto,
} from './dto/hostel.dto';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  async createHostel(data: CreateHostelDto) {
    return this.prisma.hostel.create({ data });
  }

  async getHostels() {
    return this.prisma.hostel.findMany({
      include: {
        rooms: {
          include: {
            allocations: {
              where: { status: 'Active' },
              include: {
                enrollment: {
                  include: {
                    student: true,
                    section: { include: { class: true } },
                  },
                },
              },
            },
          },
        },
        menus: true,
      },
    });
  }

  async addRoom(hostelId: string, data: AddHostelRoomDto) {
    return this.prisma.hostelRoom.create({ data: { hostelId, ...data } });
  }

  async allocateRoom(roomId: string, enrollmentId: string) {
    const room = await this.prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: { allocations: { where: { status: 'Active' } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.allocations.length >= room.capacity) {
      throw new BadRequestException('Room capacity exceeded');
    }

    return this.prisma.hostelAllocation.create({
      data: { roomId, enrollmentId },
    });
  }

  async getActiveAllocations(hostelId?: string) {
    return this.prisma.hostelAllocation.findMany({
      where: {
        status: 'Active',
        room: hostelId ? { hostelId } : undefined,
      },
      include: {
        room: { include: { hostel: true } },
        enrollment: {
          include: {
            student: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentHostel(enrollmentId: string) {
    return this.prisma.hostelAllocation.findFirst({
      where: { enrollmentId, status: 'Active' },
      include: { room: { include: { hostel: { include: { menus: true } } } } },
    });
  }

  async fileGrievance(
    hostelId: string,
    enrollmentId: string,
    title: string,
    description: string,
  ) {
    return this.prisma.hostelGrievance.create({
      data: { hostelId, enrollmentId, title, description },
    });
  }

  async getGrievances(enrollmentId: string) {
    return this.prisma.hostelGrievance.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllGrievances() {
    return this.prisma.hostelGrievance.findMany({
      include: {
        hostel: true,
        enrollment: { include: { student: true, section: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveGrievance(id: string, status: string) {
    return this.prisma.hostelGrievance.update({
      where: { id },
      data: { status },
    });
  }

  async createOutpass(data: {
    enrollmentId: string;
    reason: string;
    fromDate: string;
    toDate: string;
  }) {
    return this.prisma.hostelOutpass.create({
      data: {
        enrollmentId: data.enrollmentId,
        reason: data.reason,
        fromDate: new Date(data.fromDate),
        toDate: new Date(data.toDate),
      },
    });
  }

  async getOutpasses(enrollmentId?: string) {
    return this.prisma.hostelOutpass.findMany({
      where: enrollmentId ? { enrollmentId } : undefined,
      include: {
        enrollment: { include: { student: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveOutpass(id: string, status: string, approvedById: string) {
    return this.prisma.hostelOutpass.update({
      where: { id },
      data: { status, approvedById },
    });
  }

  async verifyOutpassExit(id: string) {
    return this.prisma.hostelOutpass.update({
      where: { id },
      data: { exitTime: new Date() },
    });
  }

  async recordOutpassReturn(id: string) {
    return this.prisma.hostelOutpass.update({
      where: { id },
      data: { returnTime: new Date(), status: 'Returned' },
    });
  }

  async markAttendance(data: MarkHostelAttendanceDto) {
    const existing = await this.prisma.hostelAttendance.findFirst({
      where: { enrollmentId: data.enrollmentId, date: data.date },
    });
    if (existing) {
      return this.prisma.hostelAttendance.update({
        where: { id: existing.id },
        data: { status: data.status },
      });
    }
    return this.prisma.hostelAttendance.create({ data });
  }

  async getAttendanceByDate(date: string, hostelId?: string) {
    return this.prisma.hostelAttendance.findMany({
      where: {
        date,
        enrollment: hostelId
          ? {
              hostelAllocations: {
                some: { room: { hostelId }, status: 'Active' },
              },
            }
          : undefined,
      },
      include: {
        enrollment: {
          include: {
            student: true,
            section: { include: { class: true } },
            hostelAllocations: {
              where: { status: 'Active' },
              include: { room: { include: { hostel: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMessMenu(data: CreateMessMenuDto) {
    return this.prisma.messMenu.create({ data });
  }

  async updateMessMenu(id: string, data: Partial<CreateMessMenuDto>) {
    return this.prisma.messMenu.update({ where: { id }, data });
  }

  async deleteMessMenu(id: string) {
    return this.prisma.messMenu.delete({ where: { id } });
  }

  async updateAllocation(
    allocationId: string,
    status?: string,
    roomId?: string,
  ) {
    const allocation = await this.prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: { room: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');

    if (roomId && roomId !== allocation.roomId) {
      const room = await this.prisma.hostelRoom.findUnique({
        where: { id: roomId },
        include: { allocations: { where: { status: 'Active' } } },
      });
      if (!room) throw new NotFoundException('Target room not found');
      if (room.allocations.length >= room.capacity) {
        throw new BadRequestException('Target room capacity exceeded');
      }
    }

    return this.prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: {
        status: status ?? allocation.status,
        roomId: roomId ?? allocation.roomId,
      },
      include: {
        room: { include: { hostel: true } },
        enrollment: {
          include: {
            student: true,
            section: { include: { class: true } },
          },
        },
      },
    });
  }
}
