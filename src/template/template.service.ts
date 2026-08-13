import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentRenderingService } from '../documents/document-rendering.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TemplateService {
  constructor(
    private prisma: PrismaService,
    private readonly renderer: DocumentRenderingService,
    private readonly storage: StorageService,
  ) {}

  async create(data: any) {
    return this.prisma.documentTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        targetAudience: data.targetAudience,
        designJson: data.designJson || {},
        status: data.status || 'Active',
      },
    });
  }

  async findAll() {
    return this.prisma.documentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, data: any) {
    return this.prisma.documentTemplate.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        targetAudience: data.targetAudience,
        designJson: data.designJson,
        status: data.status,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.documentTemplate.delete({
      where: { id },
    });
  }

  async render(templateId: string, targetId: string) {
    const template = await this.findOne(templateId);
    const targetData = await this.getTargetData(
      template.targetAudience,
      targetId,
    );
    if (!targetData) throw new NotFoundException('Target not found');

    return {
      template,
      targetData,
    };
  }

  private async getTargetData(targetAudience: string, targetId: string) {
    if (targetAudience === 'STAFF') {
      return this.prisma.staff.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          fullName: true,
          email: true,
          photoUrl: true,
          role: { select: { name: true } },
        },
      });
    }
    if (targetAudience === 'STUDENT') {
      return this.prisma.student.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          photoUrl: true,
        },
      });
    }
    return null;
  }

  /** Real fileUrl now, produced by DocumentRenderingService — fileUrl in the
   * incoming data is no longer accepted from the caller (Phase 4; used to be
   * an optional caller-supplied string with nothing behind it). */
  async issueCertificate(
    templateId: string,
    data: { studentId: string; type: string; title: string },
  ) {
    const template = await this.findOne(templateId);
    if (template.type !== 'CERTIFICATE') {
      throw new BadRequestException(
        `Template ${templateId} is type "${template.type}", not "CERTIFICATE" -- cannot issue a certificate from an ID card template.`,
      );
    }
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, fullName: true, admissionNumber: true, photoUrl: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const fileUrl = await this.renderAndStoreCertificate(
      template,
      student,
      data.type,
      data.title,
    );

    return this.prisma.certificate.create({
      data: {
        templateId,
        studentId: data.studentId,
        type: data.type,
        title: data.title,
        fileUrl,
        status: 'Active',
      },
    });
  }

  /** Self-service request (Phase 4): student/parent asks for a certificate
   * type (bonafide/transfer/migration, or any type) without picking a
   * template — nothing is rendered yet, an admin fulfils it with
   * approveCertificateRequest once they've chosen the right design. Caller
   * route has already verified the requester owns this student
   * (OwnershipService.assertOwnsStudent) before this runs. */
  async requestCertificate(data: {
    studentId: string;
    type: string;
    title: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.certificate.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        title: data.title,
        status: 'Requested',
      },
    });
  }

  /** Admin fulfils a self-service request: picks a template, renders and
   * stores the real PDF, flips status to Active. */
  async approveCertificateRequest(certificateId: string, templateId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });
    if (!certificate) throw new NotFoundException('Certificate not found');
    if (certificate.status !== 'Requested') {
      throw new BadRequestException(
        `Certificate ${certificateId} is not in "Requested" status.`,
      );
    }
    if (!certificate.studentId) {
      throw new BadRequestException(
        'This certificate has no associated student.',
      );
    }

    const template = await this.findOne(templateId);
    if (template.type !== 'CERTIFICATE') {
      throw new BadRequestException(
        `Template ${templateId} is type "${template.type}", not "CERTIFICATE".`,
      );
    }
    const student = await this.prisma.student.findUnique({
      where: { id: certificate.studentId },
      select: { id: true, fullName: true, admissionNumber: true, photoUrl: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const fileUrl = await this.renderAndStoreCertificate(
      template,
      student,
      certificate.type,
      certificate.title,
    );

    return this.prisma.certificate.update({
      where: { id: certificateId },
      data: { templateId, fileUrl, status: 'Active' },
    });
  }

  async rejectCertificateRequest(certificateId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });
    if (!certificate) throw new NotFoundException('Certificate not found');
    return this.prisma.certificate.update({
      where: { id: certificateId },
      data: { status: 'Rejected' },
    });
  }

  private async renderAndStoreCertificate(
    template: { id: string; designJson: any },
    student: {
      fullName: string;
      admissionNumber: string;
      photoUrl?: string | null;
    },
    type: string,
    title: string,
  ): Promise<string> {
    const pdfBuffer = await this.renderer.renderCertificate(template, {
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      photoUrl: student.photoUrl,
      title,
      type,
      date: new Date().toLocaleDateString('en-IN'),
    });
    const { url } = await this.storage.uploadFile(
      pdfBuffer,
      `certificates/${template.id}`,
      `${title.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`,
      'application/pdf',
    );
    return url;
  }

  async getCertificatesForTemplate(templateId: string) {
    return this.prisma.certificate.findMany({
      where: { templateId },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getCertificates(studentId?: string) {
    return this.prisma.certificate.findMany({
      where: studentId ? { studentId } : undefined,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }
}
