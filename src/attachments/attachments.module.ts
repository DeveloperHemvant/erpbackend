import { Module } from "@nestjs/common";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";
import { AttachmentRepository } from "./repositories/attachment.repository";

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentRepository],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
