import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/comment.dto";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";

@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @RequirePermissions()
  getComments(
    @Query("entityType") entityType: string,
    @Query("entityId") entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.getComments(entityType, entityId, user);
  }

  @Post()
  @RequirePermissions()
  createComment(@Body() dto: CreateCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.createComment(dto, user);
  }
}
