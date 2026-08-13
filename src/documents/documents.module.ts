import { Module } from '@nestjs/common';
import { DocumentRenderingService } from './document-rendering.service';

@Module({
  providers: [DocumentRenderingService],
  exports: [DocumentRenderingService],
})
export class DocumentsModule {}
