import { Controller, Get, Post, Body } from "@nestjs/common";
import { AcmsService } from "./acms.service";
import {
  CreateAcademicTermDto,
  CreateHolidayDto,
  CreateWorkingDayDto,
  CreateAcmsEventDto,
  CreateResourceBookingDto,
} from "./dto/acms.dto";

@Controller("acms")
export class AcmsController {
  constructor(private readonly acmsService: AcmsService) {}

  @Get("terms")
  getTerms() {
    return this.acmsService.getTerms();
  }

  @Post("terms")
  createTerm(@Body() data: CreateAcademicTermDto) {
    return this.acmsService.createTerm({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  }

  @Get("holidays")
  getHolidays() {
    return this.acmsService.getHolidays();
  }

  @Post("holidays")
  createHoliday(@Body() data: CreateHolidayDto) {
    return this.acmsService.createHoliday({
      ...data,
      date: new Date(data.date)
    });
  }

  @Get("working-days")
  getWorkingDays() {
    return this.acmsService.getWorkingDays();
  }

  @Post("working-days")
  createWorkingDay(@Body() data: CreateWorkingDayDto) {
    return this.acmsService.createWorkingDay(data);
  }

  @Get("events")
  getEvents() {
    return this.acmsService.getEvents();
  }

  @Post("events")
  createEvent(@Body() data: CreateAcmsEventDto) {
    return this.acmsService.createEvent({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  }

  @Get("bookings")
  getBookings() {
    return this.acmsService.getBookings();
  }

  @Post("bookings")
  createBooking(@Body() data: CreateResourceBookingDto) {
    return this.acmsService.createBooking({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  }

  @Get("my-calendar")
  getUnifiedCalendar() {
    return this.acmsService.getUnifiedCalendar();
  }
}
