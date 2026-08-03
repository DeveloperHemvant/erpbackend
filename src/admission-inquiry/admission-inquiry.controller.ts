import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { AdmissionInquiryService } from "./admission-inquiry.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { CreateInquiryDto, UpdateInquiryDto, AddFollowUpDto, ConvertInquiryDto } from "./dto/admission-inquiry.dto";

@RequirePermissions("MANAGE_ADMISSIONS_PIPELINE")
@Controller("admission-inquiries")
export class AdmissionInquiryController {
  constructor(private readonly service: AdmissionInquiryService) {}

  @Post()
  create(@Body() dto: CreateInquiryDto) {
    return this.service.create(dto);
  }

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateInquiryDto) {
    return this.service.update(id, dto);
  }

  @Post(":id/followups")
  addFollowUp(@Param("id") id: string, @Body() dto: AddFollowUpDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addFollowUp(id, user.userId, dto);
  }

  @Post(":id/convert")
  convert(@Param("id") id: string, @Body() dto: ConvertInquiryDto) {
    return this.service.convert(id, dto);
  }
}
