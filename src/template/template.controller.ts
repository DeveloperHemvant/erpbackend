import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
} from './dto/template.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MANAGE_ACADEMICS default (this is the backend for the
// Certificate Designer / ID Card Templates screens, matching web-app's own
// "reqModule: masterdata" grouping for both). Was undecorated (6 routes),
// therefore blocked for every non-'*' role before this fix.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

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
}
