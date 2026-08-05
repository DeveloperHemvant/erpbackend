import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MedicalRepository {
  constructor(private readonly prisma: PrismaService) {}

  createVisit(data: Prisma.HealthVisitUncheckedCreateInput) {
    return this.prisma.healthVisit.create({
      data,
      include: { student: true, loggedByStaff: true },
    });
  }

  findVisits(where?: Prisma.HealthVisitWhereInput) {
    return this.prisma.healthVisit.findMany({
      where,
      include: { student: true, loggedByStaff: true },
      orderBy: { visitDate: "desc" },
    });
  }
}
