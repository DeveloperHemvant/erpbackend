import { Controller, Post, Body, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level empty @RequirePermissions() -- deliberately open to any
// authenticated user, not a specific role. Every account (staff, parent,
// student) needs to register its own push token and read its own
// notifications; there is no meaningful narrower permission to require here.
// This controller had ZERO decorators before this fix, which under the
// global PermissionsGuard's fallback meant NO account -- not even Super
// Admin's own staff record via the normal path, only a literal '*' role
// check -- could reach these routes. Concretely: push-token registration
// and the Phase 2 morning-digest cron's in-app Notification records were
// both silently unreachable from the mobile app until this fix.
@RequirePermissions()
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
