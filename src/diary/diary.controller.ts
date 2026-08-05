import { Controller, Get, Post, Patch, Body, Param, Query } from "@nestjs/common";
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

@Controller("diary")
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @RequirePermissions("MANAGE_DIARY")
  @Post()
  createDiaryEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDiaryEntryDto) {
    return this.diaryService.createDiaryEntry(user.userId, dto);
  }

  @RequirePermissions("MANAGE_DIARY")
  @Get()
  getDiaryEntries(@Query("studentId") studentId?: string) {
    return this.diaryService.getDiaryEntries(studentId);
  }

  @RequirePermissions("MANAGE_DIARY")
  @Patch(":id/sign")
  signDiaryEntry(@Param("id") id: string) {
    return this.diaryService.signDiaryEntry(id);
  }

  @RequirePermissions("MANAGE_NEWS")
  @Post("news")
  createNewsItem(@Body() dto: CreateNewsItemDto) {
    return this.diaryService.createNewsItem(dto);
  }

  @RequirePermissions("MANAGE_NEWS")
  @Get("news")
  getDailyNews() {
    return this.diaryService.getDailyNews();
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Post("lost-found")
  createLostFound(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLostFoundDto) {
    return this.diaryService.createLostFound(user.userId, dto);
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Get("lost-found")
  getLostFoundItems() {
    return this.diaryService.getLostFoundItems();
  }

  @RequirePermissions("MANAGE_LOST_FOUND")
  @Patch("lost-found/:id/claim")
  claimLostFoundItem(@Param("id") id: string, @Query("claimantId") claimantId: string) {
    return this.diaryService.claimLostFoundItem(id, claimantId);
  }

  @RequirePermissions("MANAGE_DOCUMENTS")
  @Post("documents")
  createDocLifecycle(@Body() dto: CreateDocumentLifecycleDto) {
    return this.diaryService.createDocLifecycle(dto);
  }

  @RequirePermissions("MANAGE_DOCUMENTS")
  @Get("documents/expiring")
  getExpiringDocs() {
    return this.diaryService.getExpiringDocs();
  }
}
