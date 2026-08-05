import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MedicalRepository {
  constructor(private readonly prisma: PrismaService) {}

  createVisit(data: Prisma.MedicalVisitUncheckedCreateInput) {
    return this.prisma.medicalVisit.create({
      data,
      include: { student: true, loggedBy: true },
    });
  }

  findVisits(where?: Prisma.MedicalVisitWhereInput) {
    return this.prisma.medicalVisit.findMany({
      where,
      include: { student: true, loggedBy: true },
      orderBy: { entryTime: "desc" },
    });
  }
}
