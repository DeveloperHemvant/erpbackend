import { Module } from "@nestjs/common";
import { AdmissionInquiryController } from "./admission-inquiry.controller";
import { AdmissionInquiryService } from "./admission-inquiry.service";
import { AdmissionInquiryRepository } from "./repositories/admission-inquiry.repository";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AdmissionInquiryController],
  providers: [AdmissionInquiryService, AdmissionInquiryRepository],
  exports: [AdmissionInquiryService],
})
export class AdmissionInquiryModule {}
