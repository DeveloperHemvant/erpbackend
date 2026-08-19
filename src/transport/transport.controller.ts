import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RequireAnyPermission } from '../auth/any-permission.decorator';
import { AnyPermissionGuard } from '../auth/any-permission.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { OwnershipService } from '../auth/ownership.service';
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
  CreateOdometerLogDto,
  UpdateOdometerLogDto,
  CreateDailyCheckDto,
  ResolveFuelLogDto,
  ResolveTransportExpenseDto,
  AcknowledgeIncidentDto,
} from './dto/transport.dto';

// Class-level MANAGE_TRANSPORT default. 30 of this controller's 45 routes had
// no decorator at all, including logTripLocation (GPS tracking) and
// getRouteRoster -- both routes the mobile Boarding/Driver screens (Phase 1)
// depend on directly. Under the global PermissionsGuard's fallback, every one
// of those 30 routes was blocked for Driver/Conductor/Transport Manager alike
// -- the SOR audit's "Driver: 89%, GPS/pickup verified working" finding was
// reading correct-looking code that was silently unreachable in practice.
// The 13 routes already explicitly gated MANAGE_TRANSPORT_FLEET (vehicle/
// asset CRUD, incident acknowledgement, vendor/expense resolution) keep that
// stricter method-level requirement unchanged -- this default only fills the
// gap for routes that had nothing at all.
@RequirePermissions('MANAGE_TRANSPORT')
@Controller('transport')
export class TransportController {
  constructor(
    private readonly transportService: TransportService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- VEHICLES ---
  @Post('vehicles')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  createVehicle(@Body() data: CreateVehicleDto) {
    return this.transportService.createVehicle(data);
  }

  @Get('vehicles')
  getVehicles() {
    return this.transportService.getVehicles();
  }

  @Get('vehicles/:id/profile')
  getVehicleProfile(@Param('id') id: string) {
    return this.transportService.getVehicleProfile(id);
  }

  @Patch('vehicles/:id')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  updateVehicle(@Param('id') id: string, @Body() data: UpdateVehicleDto) {
    return this.transportService.updateVehicle(id, data);
  }

  @Delete('vehicles/:id')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  deleteVehicle(@Param('id') id: string) {
    return this.transportService.deleteVehicle(id);
  }

  // --- VEHICLE STAFF ---
  @Post('vehicles/:id/staff')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  assignStaff(@Param('id') id: string, @Body() data: AssignStaffDto) {
    return this.transportService.assignStaffToVehicle(
      id,
      data.staffId,
      data.shift,
    );
  }

  @Delete('vehicle-staff/:id')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  removeStaff(@Param('id') id: string) {
    return this.transportService.removeStaffFromVehicle(id);
  }

  // --- ROUTES & STOPS ---
  @Post('routes')
  createRoute(
    @Body() data: CreateRouteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.createRoute(data, user);
  }

  @Get('routes')
  getRoutes() {
    return this.transportService.getRoutes();
  }

  @Post('routes/:id/stops')
  addStop(
    @Param('id') id: string,
    @Body() data: AddRouteStopDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.addStop(id, data, user);
  }

  @Delete('stops/:id')
  removeStop(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.removeStop(id, user);
  }

  // --- STUDENT ASSIGNMENTS ---
  @Post('student-assignments')
  assignStudent(
    @Body() data: AssignStudentToStopDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.assignStudentToStop(
      data.enrollmentId,
      data.stopId,
      data,
      user,
    );
  }

  @Get('students/:enrollmentId')
  @UseGuards(AnyPermissionGuard)
  @RequireAnyPermission('VIEW_STUDENTS', 'MANAGE_TRANSPORT')
  @RequirePermissions()
  getStudentTransport(@Param('enrollmentId') enrollmentId: string) {
    return this.transportService.getStudentTransport(enrollmentId);
  }

  // Own-record download — same inline staff-or-ownership pattern as
  // FeesController.downloadFeeReceipt / EmsController's hall ticket route: a
  // parent/student never holds MANAGE_TRANSPORT, so ownership is checked
  // directly instead of the class default, while staff can still pull any
  // student's pass for printing/re-issue.
  @Get('students/:studentId/bus-pass/pdf')
  @RequirePermissions()
  async renderStudentBusPassPdf(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isStaff =
      user.permissions.includes('*') ||
      user.permissions.includes('MANAGE_TRANSPORT');
    if (!isStaff) {
      const role = (user.role || '').toLowerCase();
      if (role !== 'student' && role !== 'parent') {
        throw new ForbiddenException('You do not have access to this bus pass.');
      }
      await this.ownershipService.assertOwnsStudent(user, studentId);
    }
    return this.transportService.renderStudentBusPassPdf(studentId);
  }

  @Get('routes/:id/roster')
  getRouteRoster(@Param('id') id: string) {
    return this.transportService.getRouteRoster(id);
  }

  // --- TRIPS & GPS LOGS ---
  @Post('trips')
  createTrip(
    @Body() data: CreateTripDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.createTrip(data, user);
  }

  @Get('trips')
  getTrips(@Query('routeId') routeId?: string, @Query('date') date?: string) {
    return this.transportService.getTrips(routeId, date);
  }

  @Put('trips/:id')
  updateTrip(
    @Param('id') id: string,
    @Body() data: UpdateTripDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.updateTrip(id, data, user);
  }

  @Post('trips/:id/logs')
  logTripLocation(@Param('id') id: string, @Body() data: LogTripLocationDto) {
    return this.transportService.logTripLocation(id, data);
  }

  @Get('trips/:id/logs')
  getTripLogs(@Param('id') id: string) {
    return this.transportService.getTripLogs(id);
  }

  // --- ATTENDANCE ---
  @Post('attendance')
  @RequirePermissions('MANAGE_TRANSPORT')
  markAttendance(@Body() data: MarkTransportAttendanceDto) {
    return this.transportService.markAttendance(data);
  }

  @Get('trips/:id/attendance')
  getTripAttendance(@Param('id') id: string) {
    return this.transportService.getTripAttendance(id);
  }

  // --- FUEL ---
  @Post('fuel')
  logFuel(@Body() data: LogFuelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.logFuel(data, user);
  }

  @Get('fuel')
  getFuelLogs() {
    return this.transportService.getFuelLogs();
  }

  @Patch('fuel/:id/resolve')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  resolveFuelLog(
    @Param('id') id: string,
    @Body() dto: ResolveFuelLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.resolveFuelLog(id, dto, user.userId);
  }

  // --- ODOMETER LOGS ---
  @Post('odometer-logs')
  createOdometerLog(
    @Body() data: CreateOdometerLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.createOdometerLog(data, user);
  }

  @Patch('odometer-logs/:id')
  closeOdometerLog(
    @Param('id') id: string,
    @Body() data: UpdateOdometerLogDto,
  ) {
    return this.transportService.closeOdometerLog(id, data);
  }

  @Get('odometer-logs')
  getOdometerLogs(
    @Query('vehicleId') vehicleId?: string,
    @Query('date') date?: string,
  ) {
    return this.transportService.getOdometerLogs(vehicleId, date);
  }

  // --- PRE-TRIP DAILY SAFETY CHECK ---
  @Post('daily-checks')
  createDailyCheck(
    @Body() data: CreateDailyCheckDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.createDailyCheck(data, user);
  }

  @Get('daily-checks')
  getDailyChecks(
    @Query('vehicleId') vehicleId?: string,
    @Query('date') date?: string,
  ) {
    return this.transportService.getDailyChecks(vehicleId, date);
  }

  // ---------------------------------------------------------
  // MAINTENANCE & ASSETS (Phase 2)
  // ---------------------------------------------------------
  @Post('services')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  createService(@Body() data: CreateTransportServiceDto) {
    return this.transportService.createService(data);
  }

  @Get('services')
  getServices() {
    return this.transportService.getServices();
  }

  @Post('tyres')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  createTyre(@Body() data: CreateTyreDto) {
    return this.transportService.createTyre(data);
  }

  @Get('tyres')
  getTyres() {
    return this.transportService.getTyres();
  }

  @Post('batteries')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  createBattery(@Body() data: CreateBatteryDto) {
    return this.transportService.createBattery(data);
  }

  @Get('batteries')
  getBatteries() {
    return this.transportService.getBatteries();
  }

  // ---------------------------------------------------------
  // INCIDENTS
  // ---------------------------------------------------------
  @Post('breakdowns')
  reportBreakdown(
    @Body() data: ReportBreakdownDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.reportBreakdown(data, user);
  }

  @Get('breakdowns')
  getBreakdowns() {
    return this.transportService.getBreakdowns();
  }

  @Patch('breakdowns/:id/acknowledge')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  acknowledgeBreakdown(
    @Param('id') id: string,
    @Body() _dto: AcknowledgeIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.acknowledgeBreakdown(id, user.userId);
  }

  @Post('accidents')
  reportAccident(
    @Body() data: ReportAccidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.reportAccident(data, user);
  }

  @Get('accidents')
  getAccidents() {
    return this.transportService.getAccidents();
  }

  @Patch('accidents/:id/acknowledge')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  acknowledgeAccident(
    @Param('id') id: string,
    @Body() _dto: AcknowledgeIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.acknowledgeAccident(id, user.userId);
  }

  // ---------------------------------------------------------
  // VENDORS & EXPENSES
  // ---------------------------------------------------------
  @Post('vendors')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  createVendor(@Body() data: CreateTransportVendorDto) {
    return this.transportService.createVendor(data);
  }

  @Get('vendors')
  getVendors() {
    return this.transportService.getVendors();
  }

  @Post('expenses')
  createExpense(
    @Body() data: CreateTransportExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.createExpense(data, user);
  }

  @Get('expenses')
  getExpenses(@Query('from') from?: string, @Query('to') to?: string) {
    return this.transportService.getExpenses(from, to);
  }

  @Patch('expenses/:id/resolve')
  @RequirePermissions('MANAGE_TRANSPORT_FLEET')
  resolveExpense(
    @Param('id') id: string,
    @Body() dto: ResolveTransportExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transportService.resolveExpense(id, dto, user.userId);
  }
}
