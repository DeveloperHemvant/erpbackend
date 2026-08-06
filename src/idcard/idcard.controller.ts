import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { IdCardService } from './idcard.service';
import {
  CreateIdCardTemplateDto,
  UpdateIdCardTemplateDto,
} from './dto/idcard-template.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MANAGE_ACADEMICS default (matches web-app's "reqModule:
// masterdata" grouping for ID Card Templates). All 6 routes were undecorated
// and therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('idcards')
export class IdCardController {
  constructor(private readonly idCardService: IdCardService) {}

  @Get('student/:id')
  getStudentIdCard(@Param('id') id: string) {
    return this.idCardService.getStudentIdCard(id);
  }

  @Get('staff/:id')
  getStaffIdCard(@Param('id') id: string) {
    return this.idCardService.getStaffIdCard(id);
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
