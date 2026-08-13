import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AdmissionDocumentService } from './admission-document.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// Self-service (student/parent uploading their own documents) shares these
// routes with staff (MANAGE_USERS, the same permission that gates admission
// conversion in students.controller.ts) rather than getting a separate
// portal-only route — a registrar reviewing a file needs to see the exact
// same list the family sees, so one set of routes with a role branch inside
// keeps that in sync automatically instead of two parallel read paths.
@ApiTags('Admissions')
@Controller('admission-documents')
export class AdmissionDocumentController {
  constructor(
    private readonly service: AdmissionDocumentService,
    private readonly ownershipService: OwnershipService,
  ) {}

  private async assertFamilyOrStaff(
    user: AuthenticatedUser,
    studentId: string,
  ) {
    const isStaff =
      user.permissions.includes('*') || user.permissions.includes('MANAGE_USERS');
    if (isStaff) return;
    const role = (user.role || '').toLowerCase();
    if (role !== 'student' && role !== 'parent') {
      throw new ForbiddenException(
        'You do not have access to this student’s admission documents.',
      );
    }
    await this.ownershipService.assertOwnsStudent(user, studentId);
  }

  @Post('students/:studentId')
  @RequirePermissions()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an admission document for a student' })
  @ApiParam({ name: 'studentId', format: 'uuid' })
  async uploadDocument(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body('documentType') documentType: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: any,
  ) {
    await this.assertFamilyOrStaff(user, studentId);
    if (!file) throw new BadRequestException('No file was uploaded.');
    if (!documentType?.trim()) {
      throw new BadRequestException('documentType is required.');
    }
    return this.service.uploadDocument(studentId, documentType.trim(), file);
  }

  @Get('students/:studentId')
  @RequirePermissions()
  @ApiOperation({ summary: 'List admission documents for a student' })
  @ApiParam({ name: 'studentId', format: 'uuid' })
  async getDocuments(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.assertFamilyOrStaff(user, studentId);
    return this.service.getDocumentsForStudent(studentId);
  }

  @Patch(':id/verify')
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Mark an admission document verified or unverified' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async setVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.service.setVerification(id, !!isVerified);
  }

  @Delete(':id')
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Remove an admission document (e.g. wrong file uploaded)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteDocument(id);
  }
}
