import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentRequestDto } from './dto/consent.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Consent Requests')
@Controller('consent-requests')
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly ownershipService: OwnershipService,
  ) {}

  @Post()
  @RequirePermissions('MANAGE_COMMUNICATION')
  @ApiOperation({
    summary:
      'Send a consent/permission-slip request (field trip, photo policy, ...) to a targeted audience',
  })
  createConsentRequest(
    @Body() dto: CreateConsentRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consentService.createConsentRequest(dto, user.userId);
  }

  @Get()
  @RequirePermissions('MANAGE_COMMUNICATION')
  @ApiOperation({ summary: 'List all consent requests with response tallies' })
  getConsentRequests() {
    return this.consentService.getConsentRequests();
  }

  @Get('mine')
  @RequirePermissions()
  @ApiOperation({
    summary: "Get consent requests for all of the calling parent's children",
  })
  getMyConsentRequests(@CurrentUser() user: AuthenticatedUser) {
    if ((user.role || '').toLowerCase() !== 'parent') {
      throw new ForbiddenException(
        'Only a parent can view consent requests here.',
      );
    }
    return this.consentService.getResponsesForParent(user.userId);
  }

  @Get(':id')
  @RequirePermissions('MANAGE_COMMUNICATION')
  @ApiOperation({ summary: 'Get a consent request with every response' })
  getConsentRequestDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.consentService.getConsentRequestDetail(id);
  }

  // Same deliberate deviation from RequireStudentAccessOrPermission's usual
  // staff-bypass-or-ownership shape as HostelController.giveOutpassConsent:
  // recording consent must only ever come from the actual parent, so the
  // permission-bypass branch of that guard is not appropriate here — role is
  // checked explicitly, ownership is checked directly via OwnershipService.
  @Patch('responses/:responseId/respond')
  @RequirePermissions()
  @UseInterceptors(FileInterceptor('signature'))
  @ApiOperation({
    summary:
      "Parent signs or declines their child's consent request, optionally with a captured signature",
  })
  async respondToConsent(
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() signature?: any,
  ) {
    if ((user.role || '').toLowerCase() !== 'parent') {
      throw new ForbiddenException(
        'Only a parent can respond to a consent request.',
      );
    }
    if (status !== 'Signed' && status !== 'Declined') {
      throw new BadRequestException('status must be "Signed" or "Declined".');
    }
    await this.ownershipService.assertOwnsConsentResponse(user, responseId);
    return this.consentService.respondToConsent(
      responseId,
      status,
      user.userId,
      signature,
    );
  }
}
