import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsentRepository } from './repositories/consent.repository';
import { CreateConsentRequestDto } from './dto/consent.dto';
import {
  AttachmentsService,
  AttachmentFile,
} from '../attachments/attachments.service';

@Injectable()
export class ConsentService {
  constructor(
    private readonly repository: ConsentRepository,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  /**
   * Fans out one ConsentRequest into one ConsentResponse per targeted
   * student at creation time (same pre-materialize-per-recipient pattern as
   * attendance registries), so every parent independently signs/declines
   * rather than one shared "acknowledged" flag for the whole audience.
   */
  async createConsentRequest(dto: CreateConsentRequestDto, createdById: string) {
    let studentIds: string[];
    if (dto.targetType === 'ALL') {
      studentIds = await this.repository.findActiveStudentIds();
    } else if (dto.targetType === 'SECTION') {
      if (!dto.targetSectionId) {
        throw new BadRequestException(
          'targetSectionId is required when targetType is SECTION.',
        );
      }
      studentIds = await this.repository.findEnrolledStudentIdsInSection(
        dto.targetSectionId,
      );
    } else {
      if (!dto.targetStudentId) {
        throw new BadRequestException(
          'targetStudentId is required when targetType is STUDENT.',
        );
      }
      studentIds = [dto.targetStudentId];
    }

    if (studentIds.length === 0) {
      throw new BadRequestException(
        'No students matched the selected audience — nothing to send.',
      );
    }

    const request = await this.repository.createRequest({
      title: dto.title,
      description: dto.description,
      targetType: dto.targetType,
      targetSectionId: dto.targetType === 'SECTION' ? dto.targetSectionId : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdById,
    });

    await this.repository.createResponses(
      studentIds.map((studentId) => ({
        consentRequestId: request.id,
        studentId,
      })),
    );

    return { ...request, recipientCount: studentIds.length };
  }

  async getConsentRequests() {
    const requests = await this.repository.findRequests();
    return requests.map((r) => {
      const signed = r.responses.filter((x) => x.status === 'Signed').length;
      const declined = r.responses.filter((x) => x.status === 'Declined').length;
      const pending = r.responses.filter((x) => x.status === 'Pending').length;
      const { responses, ...rest } = r;
      return { ...rest, signed, declined, pending };
    });
  }

  async getConsentRequestDetail(id: string) {
    const request = await this.repository.findRequestById(id);
    if (!request) throw new NotFoundException('Consent request not found');
    return request;
  }

  async getResponsesForParent(parentId: string) {
    const studentIds = await this.repository.findChildStudentIds(parentId);
    if (studentIds.length === 0) return [];
    return this.repository.findResponsesForParent(studentIds);
  }

  /** Caller route has already verified the responding parent owns the
   * response's student (StudentAccessOrPermissionGuard, idType
   * 'consentResponse') before this runs, so the signature — if any — is
   * uploaded pre-authorized rather than through the generic role-checked
   * /attachments endpoint, same as diary sign / outpass consent. */
  async respondToConsent(
    responseId: string,
    status: 'Signed' | 'Declined',
    respondedById: string,
    signatureFile?: AttachmentFile,
  ) {
    const existing = await this.repository.findResponseById(responseId);
    if (!existing) throw new NotFoundException('Consent response not found');

    let signatureAttachmentId: string | undefined;
    if (signatureFile) {
      const attachment = await this.attachmentsService.uploadAttachmentPreauthorized(
        'consent-response',
        responseId,
        signatureFile,
        respondedById,
      );
      signatureAttachmentId = attachment.id;
    }

    return this.repository.updateResponse(responseId, {
      status,
      respondedAt: new Date(),
      respondedById,
      ...(signatureAttachmentId !== undefined && { signatureAttachmentId }),
    });
  }
}
