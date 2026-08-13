import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateIdCardTemplateDto,
  UpdateIdCardTemplateDto,
} from './dto/idcard-template.dto';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class IdCardService {
  constructor(
    private prisma: PrismaService,
    private readonly renderer: DocumentRenderingService,
    private readonly storage: StorageService,
  ) {}

  async getStudentIdCard(studentId: string) {
    const card = await this.prisma.idCard.findFirst({
      where: { studentId },
      include: {
        template: true,
        student: {
          include: {
            enrollments: { include: { section: { include: { class: true } } } },
          },
        },
      },
    });
    if (!card)
      throw new NotFoundException('ID Card not found for this student');
    return card;
  }

  /** Resolves a scanned QR/barcode (IdCard.barcodeData, falling back to
   * idNumber for cards issued before barcodeData was populated) to the
   * student or staff identity it belongs to — the gate-desk/library/visitor
   * "scan an ID" flows all key off this instead of a manual name search. */
  async lookupByCode(code: string) {
    const card = await this.prisma.idCard.findFirst({
      where: {
        status: 'Active',
        OR: [{ barcodeData: code }, { idNumber: code }],
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: 'Enrolled' },
              include: { section: { include: { class: true } } },
              take: 1,
            },
          },
        },
        staff: { include: { role: true } },
      },
    });
    if (!card) throw new NotFoundException('No active ID card matches this code');

    if (card.studentId && card.student) {
      const enrollment = (card.student as any).enrollments?.[0];
      return {
        type: 'student' as const,
        studentId: card.studentId,
        enrollmentId: enrollment?.id ?? null,
        fullName: card.student.fullName,
        admissionNumber: card.student.admissionNumber,
        className: enrollment
          ? `${enrollment.section?.class?.grade ?? ''} - ${enrollment.section?.name ?? ''}`
          : null,
        photoUrl: card.student.photoUrl,
      };
    }

    if (card.staffId && card.staff) {
      return {
        type: 'staff' as const,
        staffId: card.staffId,
        fullName: card.staff.fullName,
        role: (card.staff as any).role?.name ?? null,
        photoUrl: card.staff.photoUrl,
      };
    }

    throw new NotFoundException(
      'This ID card is not linked to a student or staff record',
    );
  }

  async getStaffIdCard(staffId: string) {
    const card = await this.prisma.idCard.findFirst({
      where: { staffId },
      include: {
        template: true,
        staff: {
          include: { role: true },
        },
      },
    });
    if (!card)
      throw new NotFoundException('ID Card not found for this staff member');
    return card;
  }

  /** Rendered fresh each call, same reasoning as ReportCardsService — a
   * personal-view download, not a one-time issued document. */
  async renderStudentIdCardPdf(studentId: string): Promise<{ url: string }> {
    const card = await this.getStudentIdCard(studentId);
    const student = card.student as any;
    const enrollment = student?.enrollments?.[0];
    const roleLabel = enrollment
      ? `${enrollment.section?.class?.grade ?? ''} - ${enrollment.section?.name ?? ''}`
      : 'Student';

    const pdfBuffer = await this.renderer.renderIdCard(card.template, {
      fullName: student.fullName,
      role: roleLabel,
      idNumber: card.idNumber,
      photoUrl: student.photoUrl,
      expiryDate: card.expiryDate
        ? new Date(card.expiryDate).toLocaleDateString('en-IN')
        : undefined,
      qrData: card.barcodeData,
    });

    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `id-cards/student/${studentId}`,
      `id-card-${card.idNumber}.pdf`,
      'application/pdf',
    );
    return { url };
  }

  async renderStaffIdCardPdf(staffId: string): Promise<{ url: string }> {
    const card = await this.getStaffIdCard(staffId);
    const staff = card.staff as any;

    const pdfBuffer = await this.renderer.renderIdCard(card.template, {
      fullName: staff.fullName,
      role: staff.role?.name || 'Staff',
      idNumber: card.idNumber,
      photoUrl: staff.photoUrl,
      expiryDate: card.expiryDate
        ? new Date(card.expiryDate).toLocaleDateString('en-IN')
        : undefined,
      qrData: card.barcodeData,
    });

    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `id-cards/staff/${staffId}`,
      `id-card-${card.idNumber}.pdf`,
      'application/pdf',
    );
    return { url };
  }

  // --- TEMPLATE MANAGEMENT ---

  async getTemplates() {
    return this.prisma.idCardTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(data: CreateIdCardTemplateDto) {
    return this.prisma.idCardTemplate.create({
      data: {
        templateName: data.templateName,
        targetRole: data.targetRole,
        primaryColor: data.primaryColor || '#000000',
        secondaryColor: data.secondaryColor || '#ffffff',
        schoolName: data.schoolName || 'Aetheria Academy',
        logoUrl: data.logoUrl || null,
        backgroundUrl: data.backgroundUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateTemplate(id: string, data: UpdateIdCardTemplateDto) {
    const template = await this.prisma.idCardTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.idCardTemplate.update({
      where: { id },
      data: {
        templateName: data.templateName,
        targetRole: data.targetRole,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        schoolName: data.schoolName,
        logoUrl: data.logoUrl,
        backgroundUrl: data.backgroundUrl,
        isActive: data.isActive,
      },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.idCardTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return this.prisma.idCardTemplate.delete({ where: { id } });
  }
}
