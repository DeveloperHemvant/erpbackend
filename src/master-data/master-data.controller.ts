import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { MasterDataService } from "./master-data.service";
import {
  CreateSessionDto,
  CreateCampusDto,
  CreateClassDto,
  CreateSubjectDto,
  CreateAssignmentDto,
  UpdateSessionDto,
  UpdateCampusDto,
  UpdateClassDto,
  UpdateSubjectDto,
  UpdateAssignmentDto
} from "./dto/master-data.dto";

@ApiTags("Master Data Repository")
@Controller("master-data")
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // ==========================================
  // ACADEMIC SESSIONS ENDPOINTS
  // ==========================================
  @Post("sessions")
  @ApiOperation({ summary: "Create a new academic calendar session" })
  createSession(@Body() dto: CreateSessionDto) {
    return this.masterDataService.createSession(dto);
  }

  @Get("sessions")
  @ApiOperation({ summary: "List all academic sessions" })
  getSessions() {
    return this.masterDataService.getSessions();
  }

  @Patch("sessions/:id/set-active")
  @ApiOperation({ summary: "Set active academic year session" })
  @ApiParam({ name: "id", format: "uuid" })
  setActiveSession(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.setActiveSession(id);
  }

  @Patch("sessions/:id")
  @ApiOperation({ summary: "Update session details" })
  @ApiParam({ name: "id", format: "uuid" })
  updateSession(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) {
    return this.masterDataService.updateSession(id, dto);
  }

  // ==========================================
  // CAMPUS ENDPOINTS
  // ==========================================
  @Post("campuses")
  @ApiOperation({ summary: "Register institutional campus branch" })
  createCampus(@Body() dto: CreateCampusDto) {
    return this.masterDataService.createCampus(dto);
  }

  @Get("campuses")
  @ApiOperation({ summary: "List all campuses" })
  getCampuses() {
    return this.masterDataService.getCampuses();
  }

  @Delete("campuses/:id")
  @ApiOperation({ summary: "Unregister campus branch" })
  @ApiParam({ name: "id", format: "uuid" })
  deleteCampus(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteCampus(id);
  }

  @Patch("campuses/:id")
  @ApiOperation({ summary: "Update campus details" })
  @ApiParam({ name: "id", format: "uuid" })
  updateCampus(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCampusDto) {
    return this.masterDataService.updateCampus(id, dto);
  }

  // ==========================================
  // CLASSES & SECTIONS ENDPOINTS
  // ==========================================
  @Post("classes")
  @ApiOperation({ summary: "Create class grade and configure sections" })
  createClass(@Body() dto: CreateClassDto) {
    return this.masterDataService.createClass(dto);
  }

  @Get("classes")
  @ApiOperation({ summary: "List all classes & sections map" })
  getClasses() {
    return this.masterDataService.getClasses();
  }

  @Delete("classes/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteClass(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteClass(id);
  }

  @Patch("classes/:id")
  @ApiOperation({ summary: "Update class grade details" })
  @ApiParam({ name: "id", format: "uuid" })
  updateClass(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateClassDto) {
    return this.masterDataService.updateClass(id, dto);
  }

  // ==========================================
  // SUBJECT MODULES ENDPOINTS
  // ==========================================
  @Post("subjects")
  @ApiOperation({ summary: "Link subject course to class and medium" })
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.masterDataService.createSubject(dto);
  }

  @Get("subjects")
  @ApiOperation({ summary: "List all subject links" })
  getSubjects() {
    return this.masterDataService.getSubjects();
  }

  @Delete("subjects/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteSubject(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteSubject(id);
  }

  @Patch("subjects/:id")
  @ApiOperation({ summary: "Update subject details" })
  @ApiParam({ name: "id", format: "uuid" })
  updateSubject(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSubjectDto) {
    return this.masterDataService.updateSubject(id, dto);
  }

  // ==========================================
  // TEACHER ALLOCATION ENDPOINTS
  // ==========================================
  @Post("allocations")
  @ApiOperation({ summary: "Allocate class teacher role and workload limit" })
  createAllocation(@Body() dto: CreateAssignmentDto) {
    return this.masterDataService.createAllocation(dto);
  }

  @Get("allocations")
  @ApiOperation({ summary: "List all class teacher allocations" })
  getAllocations() {
    return this.masterDataService.getAllocations();
  }

  @Delete("allocations/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteAllocation(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteAllocation(id);
  }

  @Patch("allocations/:id")
  @ApiOperation({ summary: "Update class teacher allocation details" })
  @ApiParam({ name: "id", format: "uuid" })
  updateAllocation(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateAssignmentDto) {
    return this.masterDataService.updateAllocation(id, dto);
  }

  // ==========================================
  // ROOM ENDPOINTS
  // ==========================================
  @Post("rooms")
  @ApiOperation({ summary: "Register a physical room (classroom/hall) for a campus" })
  createRoom(@Body() dto: { name: string; capacity: number; campusId: string }) {
    return this.masterDataService.createRoom(dto);
  }

  @Get("rooms")
  @ApiOperation({ summary: "List all rooms" })
  getRooms() {
    return this.masterDataService.getRooms();
  }

  @Delete("rooms/:id")
  @ApiParam({ name: "id", format: "uuid" })
  deleteRoom(@Param("id", ParseUUIDPipe) id: string) {
    return this.masterDataService.deleteRoom(id);
  }
}
