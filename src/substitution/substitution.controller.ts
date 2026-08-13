import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubstitutionService } from './substitution.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateSubstitutionDto } from './dto/substitution.dto';

// Class-level MANAGE_ACADEMICS (matches timetable.controller.ts, the sibling
// module this one extends — MANAGE_TIMETABLE was never a real permission
// string held by any seeded role, so every route here was unreachable by
// anyone but a '*' wildcard role).
@RequirePermissions('MANAGE_ACADEMICS')
@ApiTags('Timetable & Substitution')
@Controller('substitution')
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  @Post()
  @ApiOperation({ summary: 'Assign a substitute teacher to a slot' })
  @ApiResponse({ status: 201, description: 'Substitution scheduled' })
  createSubstitution(@Body() dto: CreateSubstitutionDto) {
    return this.substitutionService.createSubstitution(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Query timetable substitutions' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of substitutions retrieved' })
  getSubstitutions(@Query('teacherId') teacherId?: string) {
    return this.substitutionService.getSubstitutions(teacherId);
  }

  @Get('available-teachers')
  @ApiOperation({
    summary: 'Identify available free teachers for a specific period',
  })
  @ApiQuery({ name: 'timetablePeriodId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List of free teachers' })
  getAvailableTeachers(@Query('timetablePeriodId') timetablePeriodId: string) {
    return this.substitutionService.getAvailableSubstituteTeachers(
      timetablePeriodId,
    );
  }
}
