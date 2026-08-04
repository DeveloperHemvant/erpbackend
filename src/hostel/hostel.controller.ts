import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Patch, Query, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HostelService } from "./hostel.service";
import {
  CreateHostelDto,
  AddHostelRoomDto,
  AllocateRoomDto,
  FileGrievanceDto,
  MarkHostelAttendanceDto,
  CreateMessMenuDto,
  UpdateHostelAllocationDto,
  UpdateHostelGrievanceDto,
} from "./dto/hostel.dto";
import { RequirePermissions } from "../auth/permissions.decorator";

@ApiTags("Hostel")
@Controller("hostel")
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Post("hostels")
  @ApiOperation({ summary: "Create Hostel" })
  async createHostel(@Body() data: CreateHostelDto) {
    return this.hostelService.createHostel(data);
  }

  @Get("hostels")
  @RequirePermissions("MANAGE_ACADEMICS")
  @ApiOperation({ summary: "Get Hostels" })
  async getHostels() {
    return this.hostelService.getHostels();
  }

  @Post("hostels/:id/rooms")
  @ApiOperation({ summary: "Add Room to Hostel" })
  async addRoom(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: AddHostelRoomDto
  ) {
    return this.hostelService.addRoom(id, data);
  }

  @Post("allocations")
  @ApiOperation({ summary: "Allocate Room to Student" })
  async allocateRoom(@Body() data: AllocateRoomDto) {
    return this.hostelService.allocateRoom(data.roomId, data.enrollmentId);
  }

  @Get("allocations")
  @ApiOperation({ summary: "Get Active Allocations" })
  async getActiveAllocations(@Query("hostelId") hostelId?: string) {
    return this.hostelService.getActiveAllocations(hostelId);
  }

  @Patch("allocations/:id")
  @ApiOperation({ summary: "Update Room Allocation" })
  async updateAllocation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateHostelAllocationDto
  ) {
    return this.hostelService.updateAllocation(id, data.status, data.roomId);
  }

  @Get("student/:enrollmentId")
  @ApiOperation({ summary: "Get Student Hostel Info" })
  async getStudentHostel(@Param("enrollmentId", ParseUUIDPipe) enrollmentId: string) {
    return this.hostelService.getStudentHostel(enrollmentId);
  }

  @Post("grievances")
  @ApiOperation({ summary: "File Grievance" })
  async fileGrievance(@Body() data: FileGrievanceDto) {
    return this.hostelService.fileGrievance(data.hostelId, data.enrollmentId, data.title, data.description);
  }

  @Get("grievances/student/:enrollmentId")
  @ApiOperation({ summary: "Get Student Grievances" })
  async getGrievances(@Param("enrollmentId", ParseUUIDPipe) enrollmentId: string) {
    return this.hostelService.getGrievances(enrollmentId);
  }

  @Get("grievances")
  @ApiOperation({ summary: "Get All Hostel Grievances" })
  async getAllGrievances() {
    return this.hostelService.getAllGrievances();
  }

  @Patch("grievances/:id")
  @ApiOperation({ summary: "Resolve or update hostel grievance" })
  async resolveGrievance(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateHostelGrievanceDto
  ) {
    return this.hostelService.resolveGrievance(id, data.status);
  }

  @Post("attendance")
  @ApiOperation({ summary: "Mark hostel attendance" })
  async markAttendance(@Body() data: MarkHostelAttendanceDto) {
    return this.hostelService.markAttendance(data);
  }

  @Get("attendance")
  @ApiOperation({ summary: "Get hostel attendance by date" })
  async getAttendanceByDate(
    @Query("date") date: string,
    @Query("hostelId") hostelId?: string
  ) {
    return this.hostelService.getAttendanceByDate(date, hostelId);
  }

  @Post("mess-menus")
  @ApiOperation({ summary: "Create mess menu row" })
  async createMessMenu(@Body() data: CreateMessMenuDto) {
    return this.hostelService.createMessMenu(data);
  }

  @Patch("mess-menus/:id")
  @ApiOperation({ summary: "Update mess menu row" })
  async updateMessMenu(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: Partial<CreateMessMenuDto>
  ) {
    return this.hostelService.updateMessMenu(id, data);
  }

  @Delete("mess-menus/:id")
  @ApiOperation({ summary: "Delete mess menu row" })
  async deleteMessMenu(@Param("id", ParseUUIDPipe) id: string) {
    return this.hostelService.deleteMessMenu(id);
  }
}
