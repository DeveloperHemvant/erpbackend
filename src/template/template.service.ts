import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.documentTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        targetAudience: data.targetAudience,
        designJson: data.designJson || {},
        status: data.status || 'Active',
      }
    });
  }

  async findAll() {
    return this.prisma.documentTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id }
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
      }
    });
  }

  async remove(id: string) {
    return this.prisma.documentTemplate.delete({
      where: { id }
    });
  }

  async render(templateId: string, targetId: string) {
    const template = await this.findOne(templateId);
    
    let targetData: any = null;
    if (template.targetAudience === 'STAFF') {
      targetData = await this.prisma.staff.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          fullName: true,
          email: true,
          photoUrl: true,
          role: { select: { name: true } }
        }
      });
    } else if (template.targetAudience === 'STUDENT') {
      targetData = await this.prisma.student.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          photoUrl: true,
        }
      });
    }

    if (!targetData) throw new NotFoundException('Target not found');

    return {
      template,
      targetData
    };
  }
}
