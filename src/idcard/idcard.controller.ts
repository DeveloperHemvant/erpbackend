import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IdCardService } from './idcard.service';
import {
  CreateIdCardTemplateDto,
  UpdateIdCardTemplateDto,
} from './dto/idcard-template.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireSelfOrPermission } from '../auth/self-or-permission.decorator';
import { SelfOrPermissionGuard } from '../auth/self-or-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// Class-level MANAGE_ACADEMICS default (matches web-app's "reqModule:
// masterdata" grouping for ID Card Templates). All 6 routes were undecorated
// and therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('idcards')
export class IdCardController {
  constructor(private readonly idCardService: IdCardService) {}

  // Self-access fix: mobile's profile.tsx already calls these for the
  // logged-in user's own card (GET /idcards/student|staff/:userId) — without
  // this, a real student/staff account got a silent 403 here, swallowed by
  // that screen's "no card issued yet" catch block, not surfaced as a bug.
  @Get('student/:id')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('id', 'MANAGE_ACADEMICS')
  @RequirePermissions()
  getStudentIdCard(@Param('id') id: string) {
    return this.idCardService.getStudentIdCard(id);
  }

  @Get('staff/:id')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('id', 'MANAGE_ACADEMICS')
  @RequirePermissions()
  getStaffIdCard(@Param('id') id: string) {
    return this.idCardService.getStaffIdCard(id);
  }

  @Get('student/:id/pdf')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('id', 'MANAGE_ACADEMICS')
  @RequirePermissions()
  downloadStudentIdCardPdf(@Param('id') id: string) {
    return this.idCardService.renderStudentIdCardPdf(id);
  }

  @Get('staff/:id/pdf')
  @UseGuards(SelfOrPermissionGuard)
  @RequireSelfOrPermission('id', 'MANAGE_ACADEMICS')
  @RequirePermissions()
  downloadStaffIdCardPdf(@Param('id') id: string) {
    return this.idCardService.renderStaffIdCardPdf(id);
  }

  // Gate/library/visitor "scan an ID" flows — any staff account needs this
  // (librarian, reception, warden), not just MANAGE_ACADEMICS holders, so it
  // overrides the class default with a plain staff-vs-family check instead
  // of a specific permission. A student/parent scanning someone else's card
  // has no legitimate use for this, so it's staff-only, not self-or-staff.
  @Get('lookup/:code')
  @RequirePermissions()
  lookupByCode(
    @Param('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const role = (user.role || '').toLowerCase();
    if (role === 'student' || role === 'parent') {
      throw new ForbiddenException('You do not have access to this lookup.');
    }
    return this.idCardService.lookupByCode(code);
  }

  // --- TEMPLATE MANAGEMENT ---

  @Get('templates')
  getTemplates() {
    return this.idCardService.getTemplates();
  }

  @Post('templates')
  createTemplate(@Body() data: CreateIdCardTemplateDto) {
    return this.idCardService.createTemplate(data);
  }

  @Put('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() data: UpdateIdCardTemplateDto,
  ) {
    return this.idCardService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.idCardService.deleteTemplate(id);
  }
}
