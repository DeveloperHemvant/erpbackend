import { Controller, Get, Post, Body, Param, Patch, Delete, Put } from "@nestjs/common";
import { TransportService } from "./transport.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  AssignStaffDto,
  CreateRouteDto,
  AddRouteStopDto,
  AssignStudentToStopDto,
  CreateTripDto,
  UpdateTripDto,
  LogTripLocationDto,
  MarkTransportAttendanceDto,
  LogFuelDto,
  CreateTransportServiceDto,
  CreateTyreDto,
  CreateBatteryDto,
  ReportBreakdownDto,
  ReportAccidentDto,
  CreateTransportVendorDto,
  CreateTransportExpenseDto,
} from "./dto/transport.dto";

@Controller("transport")
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // --- VEHICLES ---
  @Post("vehicles")
  createVehicle(@Body() data: CreateVehicleDto) {
    return this.transportService.createVehicle(data);
  }

  @Get("vehicles")
  getVehicles() {
    return this.transportService.getVehicles();
  }

  @Get("vehicles/:id/profile")
  getVehicleProfile(@Param("id") id: string) {
    return this.transportService.getVehicleProfile(id);
  }

  @Patch("vehicles/:id")
  updateVehicle(@Param("id") id: string, @Body() data: UpdateVehicleDto) {
    return this.transportService.updateVehicle(id, data);
  }

  @Delete("vehicles/:id")
  deleteVehicle(@Param("id") id: string) {
    return this.transportService.deleteVehicle(id);
  }

  // --- VEHICLE STAFF ---
  @Post("vehicles/:id/staff")
  assignStaff(@Param("id") id: string, @Body() data: AssignStaffDto) {
    return this.transportService.assignStaffToVehicle(id, data.staffId, data.shift);
  }

  @Delete("vehicle-staff/:id")
  removeStaff(@Param("id") id: string) {
    return this.transportService.removeStaffFromVehicle(id);
  }

  // --- ROUTES & STOPS ---
  @Post("routes")
  createRoute(@Body() data: CreateRouteDto) {
    return this.transportService.createRoute(data);
  }

  @Get("routes")
  getRoutes() {
    return this.transportService.getRoutes();
  }

  @Post("routes/:id/stops")
  addStop(@Param("id") id: string, @Body() data: AddRouteStopDto) {
    return this.transportService.addStop(id, data);
  }

  @Delete("stops/:id")
  removeStop(@Param("id") id: string) {
    return this.transportService.removeStop(id);
  }

  // --- STUDENT ASSIGNMENTS ---
  @Post("student-assignments")
  assignStudent(@Body() data: AssignStudentToStopDto) {
    return this.transportService.assignStudentToStop(data.enrollmentId, data.stopId, data);
  }

  @Get("students/:enrollmentId")
  getStudentTransport(@Param("enrollmentId") enrollmentId: string) {
    return this.transportService.getStudentTransport(enrollmentId);
  }

  @Get("routes/:id/roster")
  getRouteRoster(@Param("id") id: string) {
    return this.transportService.getRouteRoster(id);
  }

  // --- TRIPS & GPS LOGS ---
  @Post("trips")
  createTrip(@Body() data: CreateTripDto) {
    return this.transportService.createTrip(data);
  }

  @Get("trips")
  getTrips() {
    return this.transportService.getTrips();
  }

  @Put("trips/:id")
  updateTrip(@Param("id") id: string, @Body() data: UpdateTripDto) {
    return this.transportService.updateTrip(id, data);
  }

  @Post("trips/:id/logs")
  logTripLocation(@Param("id") id: string, @Body() data: LogTripLocationDto) {
    return this.transportService.logTripLocation(id, data);
  }

  // --- ATTENDANCE ---
  @Post("attendance")
  @RequirePermissions("MANAGE_TRANSPORT")
  markAttendance(@Body() data: MarkTransportAttendanceDto) {
    return this.transportService.markAttendance(data);
  }

  @Get("trips/:id/attendance")
  getTripAttendance(@Param("id") id: string) {
    return this.transportService.getTripAttendance(id);
  }

  // --- FUEL ---
  @Post("fuel")
  logFuel(@Body() data: LogFuelDto) {
    return this.transportService.logFuel(data);
  }

  @Get("fuel")
  getFuelLogs() {
    return this.transportService.getFuelLogs();
  }
  // ---------------------------------------------------------
  // MAINTENANCE & ASSETS (Phase 2)
  // ---------------------------------------------------------
  @Post("services")
  createService(@Body() data: CreateTransportServiceDto) { return this.transportService.createService(data); }

  @Get("services")
  getServices() { return this.transportService.getServices(); }

  @Post("tyres")
  createTyre(@Body() data: CreateTyreDto) { return this.transportService.createTyre(data); }

  @Get("tyres")
  getTyres() { return this.transportService.getTyres(); }

  @Post("batteries")
  createBattery(@Body() data: CreateBatteryDto) { return this.transportService.createBattery(data); }

  @Get("batteries")
  getBatteries() { return this.transportService.getBatteries(); }

  // ---------------------------------------------------------
  // INCIDENTS
  // ---------------------------------------------------------
  @Post("breakdowns")
  reportBreakdown(@Body() data: ReportBreakdownDto) { return this.transportService.reportBreakdown(data); }

  @Get("breakdowns")
  getBreakdowns() { return this.transportService.getBreakdowns(); }

  @Post("accidents")
  reportAccident(@Body() data: ReportAccidentDto) { return this.transportService.reportAccident(data); }

  @Get("accidents")
  getAccidents() { return this.transportService.getAccidents(); }

  // ---------------------------------------------------------
  // VENDORS & EXPENSES
  // ---------------------------------------------------------
  @Post("vendors")
  createVendor(@Body() data: CreateTransportVendorDto) { return this.transportService.createVendor(data); }

  @Get("vendors")
  getVendors() { return this.transportService.getVendors(); }

  @Post("expenses")
  createExpense(@Body() data: CreateTransportExpenseDto) { return this.transportService.createExpense(data); }

  @Get("expenses")
  getExpenses() { return this.transportService.getExpenses(); }
}
