import { Module } from '@nestjs/common';
import { AdmissionInquiryController } from './admission-inquiry.controller';
import { AdmissionInquiryService } from './admission-inquiry.service';
import { AdmissionInquiryRepository } from './repositories/admission-inquiry.repository';
import { AuthModule } from '../auth/auth.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [AuthModule, StudentsModule],
  controllers: [AdmissionInquiryController],
  providers: [AdmissionInquiryService, AdmissionInquiryRepository],
  exports: [AdmissionInquiryService],
})
export class AdmissionInquiryModule {}
