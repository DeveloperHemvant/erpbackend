import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  private twilioClient: ReturnType<typeof twilio> | null = null;
  private twilioFromNumber: string | null = null;
  private sendgridFromEmail: string | null = null;

  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER,
      SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL,
    } = process.env;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.twilioFromNumber = TWILIO_PHONE_NUMBER;
    } else {
      this.logger.warn(
        'Twilio not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER) — SMS will be logged only, not sent.',
      );
    }

    if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
      sgMail.setApiKey(SENDGRID_API_KEY);
      this.sendgridFromEmail = SENDGRID_FROM_EMAIL;
    } else {
      this.logger.warn(
        'SendGrid not configured (SENDGRID_API_KEY/SENDGRID_FROM_EMAIL) — email will be logged only, not sent.',
      );
    }
  }

  // ---------------------------------------------------------
  // SMS / EMAIL DELIVERY
  // ---------------------------------------------------------

  private async sendSms(phone: string, content: string) {
    if (!this.twilioClient || !this.twilioFromNumber) {
      this.logger.log(
        `[SMS not configured — would send to ${phone}]: ${content}`,
      );
      return;
    }
    try {
      await this.twilioClient.messages.create({
        body: content,
        from: this.twilioFromNumber,
        to: phone,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send SMS to ${phone}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async sendEmail(email: string, subject: string, content: string) {
    if (!this.sendgridFromEmail) {
      this.logger.log(
        `[Email not configured — would send to ${email}] Subject: ${subject} | Body: ${content}`,
      );
      return;
    }
    try {
      await sgMail.send({
        to: email,
        from: this.sendgridFromEmail,
        subject,
        text: content,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${email}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** Sends a real push (via Expo) and writes the in-app Notification row with a
   * deep-link `route` in `data`, so both the push tap and the in-app list can
   * navigate straight to the relevant mobile screen. */
  private async notifyPortalAccount(
    portalAccount: { id: string; referenceId: string; userType: string },
    title: string,
    content: string,
    priority: 'URGENT' | 'NORMAL' | 'LOW',
    route: string,
  ) {
    await this.prisma.notification.create({
      data: {
        recipientId: portalAccount.id,
        type: 'PUSH',
        title,
        content,
        priority,
        data: { route },
      },
    });

    const tokens = await this.notificationsService.getTokensForUsers(
      [portalAccount.referenceId],
      portalAccount.userType,
    );
    await this.notificationsService.sendPushNotifications(tokens, title, content, { route });
  }

  // ---------------------------------------------------------
  // BUSINESS LOGIC TRIGGERS
  // ---------------------------------------------------------

  async sendAbsenceAlert(studentId: string, date: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } },
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Dear ${parent.name}, this is to inform you that ${student.fullName} was marked absent on ${date}.`;

      if (parent.phone) await this.sendSms(parent.phone, msg);
      if (parent.email)
        await this.sendEmail(parent.email, 'Absence Alert', msg);

      // Create in-app notification if they have a portal account
      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id },
      });
      if (portalAccount) {
        await this.notifyPortalAccount(
          portalAccount,
          'Absence Alert',
          msg,
          'URGENT',
          '/modules/student/attendance',
        );
      }
    }
  }

  async sendFeeReminder(studentId: string, amount: string, dueDate: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } },
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Reminder: Fee of ₹${amount} for ${student.fullName} is due by ${dueDate}. Please pay via the portal to avoid late fees.`;

      if (parent.phone) await this.sendSms(parent.phone, msg);
      if (parent.email) await this.sendEmail(parent.email, 'Fee Reminder', msg);

      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id },
      });
      if (portalAccount) {
        await this.notifyPortalAccount(
          portalAccount,
          'Fee Reminder',
          msg,
          'NORMAL',
          '/modules/student/fees',
        );
      }
    }
  }

  async sendGradeAlert(studentId: string, examName: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } },
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Report Card for ${examName} is now available for ${student.fullName}. Log in to the portal to view it.`;

      if (parent.email)
        await this.sendEmail(parent.email, 'Report Card Published', msg);

      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id },
      });
      if (portalAccount) {
        await this.notifyPortalAccount(
          portalAccount,
          'New Report Card',
          msg,
          'NORMAL',
          '/modules/student/grades',
        );
      }
    }
  }

  async sendCustomAlert(
    studentId: string,
    title: string,
    body: string,
    route = '/modules/shared/notifications',
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } },
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;

      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id },
      });
      if (portalAccount) {
        await this.notifyPortalAccount(portalAccount, title, body, 'NORMAL', route);
      }
    }
  }

  /** Grievance assignee is always a Staff row (GrievanceRecord.assignedTo),
   * which has no phone field — email is the only real channel available. */
  async notifyGrievanceAssigned(assignedToId: string, title: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: assignedToId },
    });
    if (!staff?.email) return;
    const msg = `A grievance has been assigned to you: "${title}". Please review and resolve it via the ERP.`;
    await this.sendEmail(staff.email, 'Grievance Assigned To You', msg);
  }

  /** Reporter can be a Student, Parent, or Staff member (GrievanceRecord.userType) —
   * unlike the studentId-keyed alerts above, contact info has to be resolved
   * per reporter type rather than always traversing Student -> parents. */
  async notifyGrievanceResolved(
    userType: string,
    reporterId: string,
    title: string,
    remarks?: string | null,
  ) {
    const msg = `Your grievance "${title}" has been resolved.${remarks ? ` Remarks: ${remarks}` : ''}`;

    if (userType === 'STAFF') {
      const staff = await this.prisma.staff.findUnique({
        where: { id: reporterId },
      });
      if (staff?.email) await this.sendEmail(staff.email, 'Grievance Resolved', msg);
      return;
    }

    if (userType === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: reporterId },
      });
      if (student?.phone) await this.sendSms(student.phone, msg);
    } else if (userType === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { id: reporterId },
      });
      if (parent?.phone) await this.sendSms(parent.phone, msg);
      if (parent?.email) await this.sendEmail(parent.email, 'Grievance Resolved', msg);
    }

    const portalAccount = await this.prisma.portalAccount.findFirst({
      where: { referenceId: reporterId, userType },
    });
    if (portalAccount) {
      await this.notifyPortalAccount(
        portalAccount,
        'Grievance Resolved',
        msg,
        'NORMAL',
        '/modules/shared/grievances',
      );
    }
  }

  // ---------------------------------------------------------
  // REST API ENDPOINT LOGIC
  // ---------------------------------------------------------

  async getNotifications(referenceId: string) {
    const account = await this.prisma.portalAccount.findFirst({
      where: { referenceId },
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

  async markAllNotificationsRead(referenceId: string) {
    const account = await this.prisma.portalAccount.findFirst({
      where: { referenceId },
    });
    if (!account) return { count: 0 };
    return this.prisma.notification.updateMany({
      where: { recipientId: account.id, readStatus: false },
      data: { readStatus: true },
    });
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        imageUrl: data.imageUrl,
      },
    });
  }

  async updateAnnouncement(id: string, data: any) {
    await this.getAnnouncement(id);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.targetAudience !== undefined && {
          targetAudience: data.targetAudience,
        }),
        ...(data.eventDate !== undefined && {
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
        }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  async setAnnouncementImage(id: string, imageUrl: string) {
    await this.getAnnouncement(id);
    return this.prisma.announcement.update({
      where: { id },
      data: { imageUrl },
    });
  }

  async deleteAnnouncement(id: string) {
    await this.getAnnouncement(id);
    return this.prisma.announcement.delete({ where: { id } });
  }

  // Chat/Messaging MVP logic
  async getConversations(userId: string) {
    // userId here is referenceId (Parent or Staff UUID)
    // Find conversations where they are a participant
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ parentId: userId }, { staffId: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // parentId/staffId are plain UUID columns (no Prisma relation), so the
    // counterpart's display name is resolved with a couple of batched lookups
    // rather than a join.
    const parentIds = [...new Set(conversations.map((c) => c.parentId))];
    const staffIds = [...new Set(conversations.map((c) => c.staffId))];
    const [parents, staff] = await Promise.all([
      this.prisma.parent.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true },
      }),
      this.prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true },
      }),
    ]);
    const parentMap = new Map(parents.map((p) => [p.id, p.name]));
    const staffMap = new Map(staff.map((s) => [s.id, s.fullName]));

    return conversations.map((c) => ({
      ...c,
      parentName: parentMap.get(c.parentId) || 'Parent',
      staffName: staffMap.get(c.staffId) || 'Staff',
    }));
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    senderId: string,
    senderType: string,
    conversationId: string,
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType,
        content,
      },
    });
    // Bump the conversation so the inbox list sorts by most-recently-active.
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async createConversation(parentId: string, staffId: string) {
    // Ensure unique conversation
    let conv = await this.prisma.conversation.findUnique({
      where: { parentId_staffId: { parentId, staffId } },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { parentId, staffId },
      });
    }
    return conv;
  }
}
