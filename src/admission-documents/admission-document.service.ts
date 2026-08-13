import { Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionDocumentRepository } from './repositories/admission-document.repository';
import { StorageService } from '../storage/storage.service';
import type { AttachmentFile } from '../attachments/attachments.service';

@Injectable()
export class AdmissionDocumentService {
  constructor(
    private readonly repository: AdmissionDocumentRepository,
    private readonly storage: StorageService,
  ) {}

  async uploadDocument(
    studentId: string,
    documentType: string,
    file: AttachmentFile,
  ) {
    const { url } = await this.storage.uploadFile(
      file.buffer,
      `admission-documents/${studentId}`,
      file.originalname,
      file.mimetype,
    );
    return this.repository.create({
      studentId,
      documentType,
      fileUrl: url,
    });
  }

  async getDocumentsForStudent(studentId: string) {
    return this.repository.findByStudent(studentId);
  }

  async setVerification(id: string, isVerified: boolean) {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundException('Admission document not found.');
    return this.repository.updateVerification(id, isVerified);
  }

  async deleteDocument(id: string) {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundException('Admission document not found.');
    return this.repository.delete(id);
  }
}
