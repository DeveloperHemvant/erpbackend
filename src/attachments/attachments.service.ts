import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AttachmentRepository } from "./repositories/attachment.repository";
import { UploadAttachmentDto } from "./dto/attachment.dto";
import { canAccessEntityType } from "../common/entity-permissions";
import type { AuthenticatedUser } from "../auth/current-user.decorator";

/**
 * Generic {entityType, entityId}-keyed attachment store (IA §16 #7). Mock
 * URL for now — same "no object storage yet" state as the existing
 * staff.controller.ts upload endpoint; a real bytes-backing store is future
 * work (Appendix A.4), not fabricated here.
 */
@Injectable()
export class AttachmentsService {
  constructor(private readonly repository: AttachmentRepository) {}

  async getAttachments(entityType: string, entityId: string, user: AuthenticatedUser) {
    if (!canAccessEntityType(user.permissions, entityType)) {
      throw new ForbiddenException("You do not have permission to view this record's attachments.");
    }
    return this.repository.findByEntity(entityType, entityId);
  }

  async uploadAttachment(dto: UploadAttachmentDto, file: { originalname: string; size: number }, user: AuthenticatedUser) {
    if (!canAccessEntityType(user.permissions, dto.entityType)) {
      throw new ForbiddenException("You do not have permission to attach files to this record.");
    }
    const mockUrl = `/uploads/${dto.entityType}/${dto.entityId}/${file.originalname}`;
    return this.repository.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      fileName: file.originalname,
      sizeBytes: file.size ?? 0,
      url: mockUrl,
      uploadedById: user.userId,
    });
  }

  async deleteAttachment(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException("Attachment not found");
    if (!canAccessEntityType(user.permissions, existing.entityType)) {
      throw new ForbiddenException("You do not have permission to delete this attachment.");
    }
    return this.repository.delete(id);
  }
}
