import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  IssueCertificateDto,
  RequestCertificateDto,
  ApproveCertificateRequestDto,
} from './dto/template.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// Class-level MANAGE_ACADEMICS default (this is the backend for the
// Certificate Designer / ID Card Templates screens, matching web-app's own
// "reqModule: masterdata" grouping for both). Was undecorated (6 routes),
// therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly ownershipService: OwnershipService,
  ) {}

  @Post()
  create(@Body() data: CreateDocumentTemplateDto) {
    return this.templateService.create(data);
  }

  @Get()
  findAll() {
    return this.templateService.findAll();
  }

  @Get('render')
  render(
    @Query('templateId') templateId: string,
    @Query('targetId') targetId: string,
  ) {
    return this.templateService.render(templateId, targetId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateDocumentTemplateDto) {
    return this.templateService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }

  @Post(':id/certificates')
  issueCertificate(@Param('id') id: string, @Body() data: IssueCertificateDto) {
    return this.templateService.issueCertificate(id, data);
  }

  @Get(':id/certificates')
  getCertificatesForTemplate(@Param('id') id: string) {
    return this.templateService.getCertificatesForTemplate(id);
  }

  @Get('certificates/all')
  getCertificates(@Query('studentId') studentId?: string) {
    return this.templateService.getCertificates(studentId);
  }

  // Self-service certificate requests (Phase 4) — a student/parent asking
  // for a bonafide/transfer/migration certificate never holds
  // MANAGE_ACADEMICS, so these two routes check role + ownership directly
  // instead of relying on the class-level permission default, same pattern
  // as HostelController.giveOutpassConsent / ConsentController.respondToConsent.
  @Post('certificates/request')
  @RequirePermissions()
  async requestCertificate(
    @Body() dto: RequestCertificateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const role = (user.role || '').toLowerCase();
    if (role !== 'student' && role !== 'parent') {
      throw new ForbiddenException(
        'Only a student or parent can request a certificate.',
      );
    }
    await this.ownershipService.assertOwnsStudent(user, dto.studentId);
    return this.templateService.requestCertificate(dto);
  }

  @Get('certificates/mine')
  @RequirePermissions()
  async getMyCertificates(
    @Query('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const role = (user.role || '').toLowerCase();
    if (role !== 'student' && role !== 'parent') {
      throw new ForbiddenException(
        'Only a student or parent can view their own certificates.',
      );
    }
    await this.ownershipService.assertOwnsStudent(user, studentId);
    return this.templateService.getCertificates(studentId);
  }

  @Patch('certificates/:id/approve')
  approveCertificateRequest(
    @Param('id') id: string,
    @Body() dto: ApproveCertificateRequestDto,
  ) {
    return this.templateService.approveCertificateRequest(id, dto.templateId);
  }

  @Patch('certificates/:id/reject')
  rejectCertificateRequest(@Param('id') id: string) {
    return this.templateService.rejectCertificateRequest(id);
  }
}
