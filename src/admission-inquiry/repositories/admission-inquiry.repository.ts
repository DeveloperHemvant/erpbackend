import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdmissionInquiryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AdmissionInquiryUncheckedCreateInput) {
    return this.prisma.admissionInquiry.create({
      data,
      include: { assignedToStaff: true },
    });
  }

  findAll() {
    return this.prisma.admissionInquiry.findMany({
      include: {
        assignedToStaff: true,
        followUps: true,
        convertedStudent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.admissionInquiry.findUnique({
      where: { id },
      include: {
        assignedToStaff: true,
        followUps: {
          include: { createdByStaff: true },
          orderBy: { followUpDate: 'desc' },
        },
        convertedStudent: true,
      },
    });
  }

  update(id: string, data: Prisma.AdmissionInquiryUncheckedUpdateInput) {
    return this.prisma.admissionInquiry.update({
      where: { id },
      data,
      include: { convertedStudent: true },
    });
  }

  addFollowUp(data: Prisma.AdmissionInquiryFollowUpUncheckedCreateInput) {
    return this.prisma.admissionInquiryFollowUp.create({
      data,
      include: { createdByStaff: true },
    });
  }
}
