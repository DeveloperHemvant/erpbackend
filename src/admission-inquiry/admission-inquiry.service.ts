import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdmissionInquiryRepository } from './repositories/admission-inquiry.repository';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  AddFollowUpDto,
  ConvertInquiryDto,
} from './dto/admission-inquiry.dto';

@Injectable()
export class AdmissionInquiryService {
  constructor(private readonly repository: AdmissionInquiryRepository) {}

  async create(dto: CreateInquiryDto) {
    return this.repository.create(dto);
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const inquiry = await this.repository.findById(id);
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async update(id: string, dto: UpdateInquiryDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inquiry not found');
    return this.repository.update(id, dto);
  }

  async addFollowUp(inquiryId: string, staffId: string, dto: AddFollowUpDto) {
    const existing = await this.repository.findById(inquiryId);
    if (!existing) throw new NotFoundException('Inquiry not found');
    return this.repository.addFollowUp({
      inquiryId,
      createdByStaffId: staffId,
      note: dto.note,
    });
  }

  async convert(id: string, dto: ConvertInquiryDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inquiry not found');
    if (existing.convertedStudentId)
      throw new BadRequestException('This inquiry has already been converted');
    return this.repository.update(id, {
      status: 'Converted',
      convertedStudentId: dto.studentId,
    });
  }
}
