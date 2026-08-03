import { Controller, Get, Post, Body, Param, ParseUUIDPipe, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CommunicationService } from "./communication.service";
import { CreateAnnouncementDto, SendMessageDto, InitConversationDto } from "./dto/communication.dto";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";

@ApiTags("Communication")
@Controller("communication")
export class CommunicationController {
  constructor(private readonly commService: CommunicationService) {}

  @Get("notifications/:userId")
  @ApiOperation({ summary: "Get User Notifications" })
  async getNotifications(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.commService.getNotifications(userId);
  }

  @Get("announcements")
  @ApiOperation({ summary: "Get Announcements" })
  async getAnnouncements() {
    return this.commService.getAnnouncements();
  }

  @Post("announcements")
  @ApiOperation({ summary: "Create Announcement" })
  async createAnnouncement(@Body() data: CreateAnnouncementDto) {
    return this.commService.createAnnouncement(data);
  }

  @Get("chat/conversations/:userId")
  @RequirePermissions()
  @ApiOperation({ summary: "Get User Conversations" })
  async getConversations(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.commService.getConversations(userId);
  }

  @Get("chat/:conversationId/messages")
  @RequirePermissions()
  @ApiOperation({ summary: "Get Conversation Messages" })
  async getMessages(@Param("conversationId", ParseUUIDPipe) conversationId: string) {
    return this.commService.getMessages(conversationId);
  }

  @Post("chat/send")
  @RequirePermissions()
  @ApiOperation({ summary: "Send a Message" })
  async sendMessage(@Body() data: SendMessageDto, @CurrentUser() currentUser: AuthenticatedUser) {
    if (data.senderId !== currentUser.userId && !currentUser.permissions.includes("*")) {
      throw new ForbiddenException("You can only send messages as yourself.");
    }
    return this.commService.sendMessage(data.senderId, data.senderType, data.conversationId, data.content);
  }

  @Post("chat/init")
  @RequirePermissions()
  @ApiOperation({ summary: "Initialize Conversation" })
  async initConversation(@Body() data: InitConversationDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const isParticipant = data.parentId === currentUser.userId || data.staffId === currentUser.userId;
    if (!isParticipant && !currentUser.permissions.includes("*")) {
      throw new ForbiddenException("You can only start a conversation you are a participant in.");
    }
    return this.commService.createConversation(data.parentId, data.staffId);
  }
}
