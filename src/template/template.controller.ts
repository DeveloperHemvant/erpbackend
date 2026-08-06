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
