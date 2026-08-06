import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

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
}
