import { Controller, Post, Body, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({
    summary: 'Register or update a device push token for the logged-in user',
  })
  registerToken(@Body() dto: RegisterPushTokenDto) {
    return this.notificationsService.registerToken(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  getNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getNotifications(user.userId);
  }

  @Patch(':id/read')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Mark a notification as read' })
  markNotificationRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markNotificationRead(id);
  }
}
