import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VisitorRepository {
  constructor(private readonly prisma: PrismaService) {}

  createVisitor(data: Prisma.VisitorRecordUncheckedCreateInput) {
    return this.prisma.visitorRecord.create({ data });
  }

  findVisitorById(id: string) {
    return this.prisma.visitorRecord.findUnique({
      where: { id },
      include: { host: true },
    });
  }

  findVisitors(where?: Prisma.VisitorRecordWhereInput) {
    return this.prisma.visitorRecord.findMany({
      where,
      include: { host: true },
      orderBy: { entryTime: 'desc' },
    });
  }

  updateVisitor(id: string, data: Prisma.VisitorRecordUncheckedUpdateInput) {
    return this.prisma.visitorRecord.update({ where: { id }, data });
  }

  createGatePass(data: Prisma.StudentGatePassUncheckedCreateInput) {
    return this.prisma.studentGatePass.create({
      data,
      include: { student: true, approvedBy: true },
    });
  }

  findGatePassById(id: string) {
    return this.prisma.studentGatePass.findUnique({
      where: { id },
      include: { student: true, approvedBy: true },
    });
  }

  findGatePasses(where?: Prisma.StudentGatePassWhereInput) {
    return this.prisma.studentGatePass.findMany({
      where,
      include: { student: true, approvedBy: true },
      orderBy: { exitTime: 'desc' },
    });
  }

  updateGatePass(id: string, data: Prisma.StudentGatePassUncheckedUpdateInput) {
    return this.prisma.studentGatePass.update({ where: { id }, data });
  }

  createVehicleLog(data: Prisma.VehicleGateLogUncheckedCreateInput) {
    return this.prisma.vehicleGateLog.create({ data });
  }

  updateVehicleLog(id: string, data: Prisma.VehicleGateLogUncheckedUpdateInput) {
    return this.prisma.vehicleGateLog.update({ where: { id }, data });
  }

  findVehicleLogs() {
    return this.prisma.vehicleGateLog.findMany({
      include: { loggedBy: { select: { id: true, fullName: true } } },
      orderBy: { entryTime: 'desc' },
    });
  }

  createStudentGateLog(data: Prisma.StudentGateLogUncheckedCreateInput) {
    return this.prisma.studentGateLog.create({ data });
  }

  findStudentGateLogs(enrollmentId?: string) {
    return this.prisma.studentGateLog.findMany({
      where: enrollmentId ? { enrollmentId } : undefined,
      include: {
        enrollment: { include: { student: true } },
        loggedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
