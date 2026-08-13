import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttachmentRepository } from './repositories/attachment.repository';
import { UploadAttachmentDto } from './dto/attachment.dto';
import { canAccessEntityType } from '../common/entity-permissions';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { StorageService } from '../storage/storage.service';

export interface AttachmentFile {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
}

/**
 * Generic {entityType, entityId}-keyed attachment store (IA §16 #7). Backed
 * by StorageService for real bytes-on-disk/S3 storage (Appendix A.4) — no
 * longer a mock URL.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly repository: AttachmentRepository,
    private readonly storage: StorageService,
  ) {}

  async getAttachments(
    entityType: string,
    entityId: string,
    user: AuthenticatedUser,
  ) {
    if (!canAccessEntityType(user.permissions, entityType)) {
      throw new ForbiddenException(
        "You do not have permission to view this record's attachments.",
      );
    }
    return this.repository.findByEntity(entityType, entityId);
  }

  async uploadAttachment(
    dto: UploadAttachmentDto,
    file: AttachmentFile,
    user: AuthenticatedUser,
  ) {
    if (!canAccessEntityType(user.permissions, dto.entityType)) {
      throw new ForbiddenException(
        'You do not have permission to attach files to this record.',
      );
    }
    return this.storeFile(dto.entityType, dto.entityId, file, user.userId);
  }

  /**
   * Same upload path as uploadAttachment, but skips the generic
   * canAccessEntityType role check — for entity types where access is
   * per-record ownership rather than a role-wide permission (e.g. a
   * student's own hostel outpass), where the CALLER route is expected to
   * have already authorized the specific record via its own guard
   * (see HostelController's outpass attachment routes).
   */
  async uploadAttachmentPreauthorized(
    entityType: string,
    entityId: string,
    file: AttachmentFile,
    uploadedById: string,
  ) {
    return this.storeFile(entityType, entityId, file, uploadedById);
  }

  /** Read-only counterpart to uploadAttachmentPreauthorized. */
  async getAttachmentsPreauthorized(entityType: string, entityId: string) {
    return this.repository.findByEntity(entityType, entityId);
  }

  private async storeFile(
    entityType: string,
    entityId: string,
    file: AttachmentFile,
    uploadedById: string,
  ) {
    const { url } = await this.storage.uploadFile(
      file.buffer,
      `attachments/${entityType}/${entityId}`,
      file.originalname,
      file.mimetype,
    );
    return this.repository.create({
      entityType,
      entityId,
      fileName: file.originalname,
      sizeBytes: file.size ?? 0,
      url,
      uploadedById,
    });
  }

  async deleteAttachment(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Attachment not found');
    if (!canAccessEntityType(user.permissions, existing.entityType)) {
      throw new ForbiddenException(
        'You do not have permission to delete this attachment.',
      );
    }
    return this.repository.delete(id);
  }

  /** Preauthorized counterpart to deleteAttachment — see uploadAttachmentPreauthorized. */
  async deleteAttachmentPreauthorized(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Attachment not found');
    return this.repository.delete(id);
  }
}
