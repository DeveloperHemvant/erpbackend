import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/attachment.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  @RequirePermissions()
  getAttachments(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.getAttachments(entityType, entityId, user);
  }

  @Post()
  @RequirePermissions()
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Body() dto: UploadAttachmentDto,
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.uploadAttachment(dto, file, user);
  }

  @Delete(':id')
  @RequirePermissions()
  deleteAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.deleteAttachment(id, user);
  }
}
