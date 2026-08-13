import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdmissionDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AdmissionDocumentUncheckedCreateInput) {
    return this.prisma.admissionDocument.create({ data });
  }

  findByStudent(studentId: string) {
    return this.prisma.admissionDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.admissionDocument.findUnique({ where: { id } });
  }

  updateVerification(id: string, isVerified: boolean) {
    return this.prisma.admissionDocument.update({
      where: { id },
      data: { isVerified },
    });
  }

  delete(id: string) {
    return this.prisma.admissionDocument.delete({ where: { id } });
  }
}
