import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DiaryRepository } from './repositories/diary.repository';
import {
  CreateDiaryEntryDto,
  CreateNewsItemDto,
  CreateLostFoundDto,
  CreateDocumentLifecycleDto,
} from './dto/diary.dto';

@Injectable()
export class DiaryService {
  constructor(private readonly repository: DiaryRepository) {}

  async createDiaryEntry(teacherId: string, dto: CreateDiaryEntryDto) {
    if (dto.type === 'HOMEWORK') {
      throw new BadRequestException('Homework must be registered using LMS Assignment Engine rather than the School Diary.');
    }
    return this.repository.createDiaryEntry({
      studentId: dto.studentId,
      teacherId,
      type: dto.type,
      content: dto.content,
    });
  }

  async getDiaryEntries(studentId?: string) {
    const where = studentId ? { studentId } : undefined;
    return this.repository.findDiaryEntries(where);
  }

  async signDiaryEntry(id: string, signatureAttachmentId?: string) {
    const entry = await this.repository.updateDiaryEntry(id, {
      parentSigned: true,
      parentSignedAt: new Date(),
      ...(signatureAttachmentId !== undefined && { signatureAttachmentId }),
    });
    if (!entry) throw new NotFoundException('Diary entry not found');
    return entry;
  }

  async createNewsItem(dto: CreateNewsItemDto) {
    return this.repository.createNewsItem({
      national: dto.national,
      international: dto.international,
      sports: dto.sports,
      weather: dto.weather,
      importantDay: dto.importantDay,
      festival: dto.festival,
    });
  }

  async getDailyNews() {
    return this.repository.findNewsItems();
  }

  async createLostFound(reporterId: string, dto: CreateLostFoundDto) {
    return this.repository.createLostFound({
      status: dto.status,
      itemName: dto.itemName,
      description: dto.description,
      photoUrl: dto.photoUrl,
      reporterId,
    });
  }

  async getLostFoundItems() {
    return this.repository.findLostFound();
  }

  async claimLostFoundItem(id: string, claimantId: string) {
    const item = await this.repository.updateLostFound(id, {
      claimantId,
      claimedAt: new Date(),
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async createDocLifecycle(dto: CreateDocumentLifecycleDto) {
    return this.repository.createDocLifecycle({
      entityType: dto.entityType,
      entityId: dto.entityId,
      docType: dto.docType,
      docNumber: dto.docNumber,
      expiryDate: new Date(dto.expiryDate),
      alertDays: dto.alertDays || 30,
      status: 'Active',
    });
  }

  async getExpiringDocs() {
    // Return docs expiring within their alert window
    const docs = await this.repository.findDocLifecycles();
    const now = new Date();
    return docs.filter((doc) => {
      const expiry = new Date(doc.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= doc.alertDays && doc.status === 'Active';
    });
  }
}
