import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdCardTemplateDto, UpdateIdCardTemplateDto } from './dto/idcard-template.dto';

@Injectable()
export class IdCardService {
  constructor(private prisma: PrismaService) {}

  async getStudentIdCard(studentId: string) {
    const card = await this.prisma.idCard.findFirst({
      where: { studentId },
      include: {
        template: true,
        student: {
          include: {
            enrollments: { include: { section: { include: { class: true } } } }
          }
        }
      }
    });
    if (!card) throw new NotFoundException('ID Card not found for this student');
    return card;
  }

  async getStaffIdCard(staffId: string) {
    const card = await this.prisma.idCard.findFirst({
      where: { staffId },
      include: {
        template: true,
        staff: {
          include: { role: true }
        }
      }
    });
    if (!card) throw new NotFoundException('ID Card not found for this staff member');
    return card;
  }

  // --- TEMPLATE MANAGEMENT ---

  async getTemplates() {
    return this.prisma.idCardTemplate.findMany({
      orderBy: { createdAt: 'desc' }
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
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async updateTemplate(id: string, data: UpdateIdCardTemplateDto) {
    const template = await this.prisma.idCardTemplate.findUnique({ where: { id } });
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
        isActive: data.isActive
      }
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.idCardTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return this.prisma.idCardTemplate.delete({ where: { id } });
  }
}
