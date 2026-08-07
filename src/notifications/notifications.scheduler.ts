import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

/** Daily morning digest for parents — the SOR audit found no scheduled job
 * existed anywhere (`grep -rl "@Cron"` = 0 hits) despite the mobile push-token
 * registration and send path both already working. Sends one push + one
 * in-app Notification per parent who has a registered device. */
@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendMorningDigest() {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const [recentAnnouncements, parentsWithTokens] = await Promise.all([
      this.prisma.announcement.findMany({
        where: {
          createdAt: { gte: since },
          targetAudience: { in: ['ALL', 'PARENTS'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pushToken.findMany({
        where: { userType: 'PARENT' },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    if (parentsWithTokens.length === 0) {
      this.logger.log('Morning digest: no parent devices registered, skipping.');
      return;
    }

    const title = 'Good morning!';
    const body =
      recentAnnouncements.length > 0
        ? `${recentAnnouncements.length} new announcement${recentAnnouncements.length === 1 ? '' : 's'} since yesterday. Open the app for today's attendance, bus, and homework updates.`
        : "Open the app for today's attendance, bus, and homework updates.";

    let sent = 0;
    for (const { userId: parentId } of parentsWithTokens) {
      const [tokens, account] = await Promise.all([
        this.notifications.getTokensForUsers([parentId], 'PARENT'),
        this.prisma.portalAccount.findFirst({
          where: { userType: 'PARENT', referenceId: parentId },
        }),
      ]);

      await this.notifications.sendPushNotifications(tokens, title, body);

      if (account) {
        await this.prisma.notification.create({
          data: {
            recipientId: account.id,
            type: 'PUSH',
            title,
            content: body,
            priority: 'NORMAL',
          },
        });
      }
      sent++;
    }

    this.logger.log(`Morning digest sent to ${sent} parent(s).`);
  }
}
