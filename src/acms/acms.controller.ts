import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AcmsService } from './acms.service';
import { imageUploadOptions, imageUrlFor } from '../common/image-upload';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  CreateAcademicTermDto,
  CreateHolidayDto,
  CreateWorkingDayDto,
  UpdateWorkingDayDto,
  CreateAcmsEventDto,
  UpdateAcmsEventDto,
  CreateResourceBookingDto,
} from './dto/acms.dto';

// Class-level MANAGE_ACADEMICS default. This controller had NO permission
// decorators at all (15 routes), which under the global PermissionsGuard's
// fallback (no requirement -> implicit literal "read"/"write") meant every
// route -- including calendar admin CRUD -- was unreachable by any non-'*'
// role. my-calendar (a personal read view, see web-app's own "reqModule:
// attendance" grouping for it) is deliberately overridden open below.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('acms')
export class AcmsController {
  constructor(private readonly acmsService: AcmsService) {}

  @Get('terms')
  getTerms() {
    return this.acmsService.getTerms();
  }

  @Post('terms')
  createTerm(@Body() data: CreateAcademicTermDto) {
    return this.acmsService.createTerm({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Get('holidays')
  getHolidays() {
    return this.acmsService.getHolidays();
  }

  @Post('holidays')
  createHoliday(@Body() data: CreateHolidayDto) {
    return this.acmsService.createHoliday({
      ...data,
      date: new Date(data.date),
    });
  }

  @Get('working-days')
  getWorkingDays() {
    return this.acmsService.getWorkingDays();
  }

  @Post('working-days')
  createWorkingDay(@Body() data: CreateWorkingDayDto) {
    return this.acmsService.createWorkingDay(data);
  }

  @Put('working-days/:id')
  updateWorkingDay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateWorkingDayDto,
  ) {
    return this.acmsService.updateWorkingDay(id, data);
  }

  @Get('events')
  getEvents() {
    return this.acmsService.getEvents();
  }

  @Get('events/:id')
  getEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.acmsService.getEvent(id);
  }

  @Post('events')
  createEvent(@Body() data: CreateAcmsEventDto) {
    return this.acmsService.createEvent({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Put('events/:id')
  updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateAcmsEventDto,
  ) {
    return this.acmsService.updateEvent(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  @Delete('events/:id')
  deleteEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.acmsService.deleteEvent(id);
  }

  @Post('events/:id/image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions('events')))
  uploadEventImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = imageUrlFor('events', file.filename);
    return this.acmsService.setEventImage(id, imageUrl);
  }

  @Get('bookings')
  getBookings() {
    return this.acmsService.getBookings();
  }

  @Post('bookings')
  createBooking(@Body() data: CreateResourceBookingDto) {
    return this.acmsService.createBooking({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Get('my-calendar')
  @RequirePermissions()
  getUnifiedCalendar() {
    return this.acmsService.getUnifiedCalendar();
  }
}
