import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HostelService } from "./hostel.service";
import { CreateHostelDto, AddHostelRoomDto, AllocateRoomDto, FileGrievanceDto } from "./dto/hostel.dto";
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
}
