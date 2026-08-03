import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHostelDto, AddHostelRoomDto } from "./dto/hostel.dto";

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  async createHostel(data: CreateHostelDto) {
    return this.prisma.hostel.create({ data });
  }

  async getHostels() {
    return this.prisma.hostel.findMany({
      include: { rooms: { include: { allocations: true } }, menus: true },
    });
  }

  async addRoom(hostelId: string, data: AddHostelRoomDto) {
    return this.prisma.hostelRoom.create({ data: { hostelId, ...data } });
  }

  async allocateRoom(roomId: string, enrollmentId: string) {
    return this.prisma.hostelAllocation.create({
      data: { roomId, enrollmentId }
    });
  }

  async getStudentHostel(enrollmentId: string) {
    return this.prisma.hostelAllocation.findFirst({
      where: { enrollmentId, status: "Active" },
      include: { room: { include: { hostel: { include: { menus: true } } } } }
    });
  }

  async fileGrievance(hostelId: string, enrollmentId: string, title: string, description: string) {
    return this.prisma.hostelGrievance.create({
      data: { hostelId, enrollmentId, title, description }
    });
  }

  async getGrievances(enrollmentId: string) {
    return this.prisma.hostelGrievance.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: "desc" }
    });
  }
}
