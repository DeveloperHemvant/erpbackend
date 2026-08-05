import { Controller, Get, Post, Patch, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { DiaryService } from "./diary.service";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import {
  CreateDiaryEntryDto,
  CreateNewsItemDto,
  CreateLostFoundDto,
  CreateDocumentLifecycleDto,
} from "./dto/diary.dto";

@ApiTags("Diary, News & Lost-Found")
@Controller("diary")
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @RequirePermissions("MANAGE_DIARY")
  @Post()
  @ApiOperation({ summary: "Create a new school diary entry" })
  @ApiResponse({ status: 201, description: "Diary entry logged successfully" })
  createDiaryEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDiaryEntryDto) {
    return this.diaryService.createDiaryEntry(user.userId, dto);
  }

  @RequirePermissions("MANAGE_DIARY")
  @Get()
  @ApiOperation({ summary: "Get diary entries log" })
  @ApiQuery({ name: "studentId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of diary entries retrieved" })
  getDiaryEntries(@Query("studentId") studentId?: string) {
    return this.diaryService.getDiaryEntries(studentId);
  }

  @RequirePermissions("MANAGE_DIARY")
  @Patch(":id/sign")
  @ApiOperation({ summary: "Sign a diary entry (parent authorization)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Diary entry signed" })
  signDiaryEntry(@Param("id") id: string) {
    return this.diaryService.signDiaryEntry(id);
  }

  @RequirePermissions("MANAGE_NEWS")
  @Post("news")
  @ApiOperation({ summary: "Log a daily news item" })
  @ApiResponse({ status: 201, description: "Daily news created" })
  createNewsItem(@Body() dto: CreateNewsItemDto) {
    return this.diaryService.createNewsItem(dto);
  }

  @RequirePermissions("MANAGE_NEWS")
  @Get("news")
  @ApiOperation({ summary: "Get latest daily news bulletin" })
  @ApiResponse({ status: 200, description: "Daily news logs" })
  getDailyNews() {
    return this.diaryService.getDailyNews();
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Post("lost-found")
  @ApiOperation({ summary: "Log a lost or found item" })
  @ApiResponse({ status: 201, description: "Item logged" })
  createLostFound(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLostFoundDto) {
    return this.diaryService.createLostFound(user.userId, dto);
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Get("lost-found")
  @ApiOperation({ summary: "List all items in the inventory" })
  @ApiResponse({ status: 200, description: "List of lost/found items" })
  getLostFoundItems() {
    return this.diaryService.getLostFoundItems();
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Patch("lost-found/:id/claim")
  @ApiOperation({ summary: "Log a claim and hand over an item" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiQuery({ name: "claimantId", required: true, type: String })
  @ApiResponse({ status: 200, description: "Claim completed successfully" })
  claimLostFoundItem(@Param("id") id: string, @Query("claimantId") claimantId: string) {
    return this.diaryService.claimLostFoundItem(id, claimantId);
  }

  @RequirePermissions("MANAGE_DOCUMENTS")
  @Post("documents")
  @ApiOperation({ summary: "Register an expiring document (licenses/fitness/insurances)" })
  @ApiResponse({ status: 201, description: "Document tracking registered" })
  createDocLifecycle(@Body() dto: CreateDocumentLifecycleDto) {
    return this.diaryService.createDocLifecycle(dto);
  }

  @RequirePermissions("MANAGE_DOCUMENTS")
  @Get("documents/expiring")
  @ApiOperation({ summary: "Fetch documents nearing expiration within warning limits" })
  @ApiResponse({ status: 200, description: "List of expiring documents" })
  getExpiringDocs() {
    return this.diaryService.getExpiringDocs();
  }
}
