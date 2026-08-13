import { Module } from '@nestjs/common';
import { AdmissionDocumentController } from './admission-document.controller';
import { AdmissionDocumentService } from './admission-document.service';
import { AdmissionDocumentRepository } from './repositories/admission-document.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdmissionDocumentController],
  providers: [AdmissionDocumentService, AdmissionDocumentRepository],
  exports: [AdmissionDocumentService],
})
export class AdmissionDocumentModule {}
