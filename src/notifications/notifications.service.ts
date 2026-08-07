import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  registerToken(dto: RegisterPushTokenDto) {
    return this.prisma.pushToken.upsert({
      where: { token: dto.token },
      update: { userId: dto.userId, userType: dto.userType },
      create: { userId: dto.userId, userType: dto.userType, token: dto.token },
    });
  }

  async getTokensForUsers(
    userIds: string[],
    userType: string,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];
    const records = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds }, userType },
    });
    return records.map((r) => r.token);
  }

  async sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    if (tokens.length === 0) return;

    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      data,
      sound: 'default',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push send failed with status ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Expo push send failed: ${err}`);
    }
  }

  async getNotifications(userId: string) {
    const account = await this.prisma.portalAccount.findFirst({
      where: { referenceId: userId },
    });
    if (!account) return [];
    return this.prisma.notification.findMany({
      where: { recipientId: account.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readStatus: true },
    });
  }
}
