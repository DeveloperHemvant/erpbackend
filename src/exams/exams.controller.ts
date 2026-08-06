import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  CreateExamSlotDto,
  SubmitExamMarksDto,
} from './dto/exam.dto';

@ApiTags('ERP Core Features')
@Controller('erp-core')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('exams')
  @ApiOperation({ summary: 'Create a new exam' })
  createExam(@Body() dto: CreateExamDto) {
    return this.examsService.createExam(dto);
  }

  @Get('exams')
  @ApiOperation({ summary: 'List exams' })
  getExams() {
    return this.examsService.getExams();
  }

  @Post('exams/slots')
  @ApiOperation({ summary: 'Schedule an exam slot' })
  createExamSlot(@Body() dto: CreateExamSlotDto) {
    return this.examsService.createExamSlot(dto);
  }

  @Get('exams/slots')
  @ApiOperation({ summary: 'List exam slots' })
  getExamSlots() {
    return this.examsService.getExamSlots();
  }

  @Post('exams/marks')
  @ApiOperation({ summary: 'Submit marks for an exam slot' })
  submitExamMarks(@Body() dto: SubmitExamMarksDto) {
    return this.examsService.submitExamMarks(dto);
  }

  @Get('exams/marks/:slotId')
  @ApiOperation({ summary: 'Get marks for a slot' })
  @ApiParam({ name: 'slotId', format: 'uuid' })
  getExamMarks(@Param('slotId', ParseUUIDPipe) slotId: string) {
    return this.examsService.getExamMarks(slotId);
  }
}
