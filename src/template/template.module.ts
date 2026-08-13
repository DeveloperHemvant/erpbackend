import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
