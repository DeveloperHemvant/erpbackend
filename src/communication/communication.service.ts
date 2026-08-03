// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  private twilioClient: ReturnType<typeof twilio> | null = null;
  private twilioFromNumber: string | null = null;
  private sendgridFromEmail: string | null = null;

  constructor(private prisma: PrismaService) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = process.env;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.twilioFromNumber = TWILIO_PHONE_NUMBER;
    } else {
      this.logger.warn("Twilio not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER) — SMS will be logged only, not sent.");
    }

    if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
      sgMail.setApiKey(SENDGRID_API_KEY);
      this.sendgridFromEmail = SENDGRID_FROM_EMAIL;
    } else {
      this.logger.warn("SendGrid not configured (SENDGRID_API_KEY/SENDGRID_FROM_EMAIL) — email will be logged only, not sent.");
    }
  }

  // ---------------------------------------------------------
  // SMS / EMAIL DELIVERY
  // ---------------------------------------------------------

  private async sendSms(phone: string, content: string) {
    if (!this.twilioClient || !this.twilioFromNumber) {
      this.logger.log(`[SMS not configured — would send to ${phone}]: ${content}`);
      return;
    }
    try {
      await this.twilioClient.messages.create({ body: content, from: this.twilioFromNumber, to: phone });
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${phone}: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async sendEmail(email: string, subject: string, content: string) {
    if (!this.sendgridFromEmail) {
      this.logger.log(`[Email not configured — would send to ${email}] Subject: ${subject} | Body: ${content}`);
      return;
    }
    try {
      await sgMail.send({ to: email, from: this.sendgridFromEmail, subject, text: content });
    } catch (err) {
      this.logger.error(`Failed to send email to ${email}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ---------------------------------------------------------
  // BUSINESS LOGIC TRIGGERS
  // ---------------------------------------------------------

  async sendAbsenceAlert(studentId: string, date: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } }
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Dear ${parent.name}, this is to inform you that ${student.fullName} was marked absent on ${date}.`;
      
      if (parent.phone) await this.sendSms(parent.phone, msg);
      if (parent.email) await this.sendEmail(parent.email, "Absence Alert", msg);

      // Create in-app notification if they have a portal account
      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id }
      });
      if (portalAccount) {
        await this.prisma.notification.create({
          data: {
            recipientId: portalAccount.id,
            type: "PUSH",
            title: "Absence Alert",
            content: msg,
            priority: "URGENT"
          }
        });
      }
    }
  }

  async sendFeeReminder(studentId: string, amount: string, dueDate: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } }
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Reminder: Fee of ₹${amount} for ${student.fullName} is due by ${dueDate}. Please pay via the portal to avoid late fees.`;
      
      if (parent.phone) await this.sendSms(parent.phone, msg);
      if (parent.email) await this.sendEmail(parent.email, "Fee Reminder", msg);

      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id }
      });
      if (portalAccount) {
        await this.prisma.notification.create({
          data: {
            recipientId: portalAccount.id,
            type: "PUSH",
            title: "Fee Reminder",
            content: msg,
            priority: "NORMAL"
          }
        });
      }
    }
  }

  async sendGradeAlert(studentId: string, examName: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } }
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      const msg = `Report Card for ${examName} is now available for ${student.fullName}. Log in to the portal to view it.`;
      
      if (parent.email) await this.sendEmail(parent.email, "Report Card Published", msg);

      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id }
      });
      if (portalAccount) {
        await this.prisma.notification.create({
          data: {
            recipientId: portalAccount.id,
            type: "PUSH",
            title: "New Report Card",
            content: msg,
            priority: "NORMAL"
          }
        });
      }
    }
  }

  async sendCustomAlert(studentId: string, title: string, body: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { parents: { include: { parent: true } } }
    });

    if (!student) return;

    const parents = student.parents || [];
    for (const p of parents) {
      const parent = p.parent;
      
      const portalAccount = await this.prisma.portalAccount.findFirst({
        where: { referenceId: parent.id }
      });
      if (portalAccount) {
        await this.prisma.notification.create({
          data: {
            recipientId: portalAccount.id,
            type: "PUSH",
            title: title,
            content: body,
            priority: "NORMAL"
          }
        });
      }
    }
  }

  // ---------------------------------------------------------
  // REST API ENDPOINT LOGIC
  // ---------------------------------------------------------

  async getNotifications(referenceId: string) {
    const account = await this.prisma.portalAccount.findFirst({ where: { referenceId } });
    if (!account) return [];
    return this.prisma.notification.findMany({
      where: { recipientId: account.id },
      orderBy: { createdAt: "desc" }
    });
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience,
        eventDate: data.eventDate ? new Date(data.eventDate) : null
      }
    });
  }

  // Chat/Messaging MVP logic
  async getConversations(userId: string) {
    // userId here is referenceId (Parent or Staff UUID)
    // Find conversations where they are a participant
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { parentId: userId },
          { staffId: userId }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // parentId/staffId are plain UUID columns (no Prisma relation), so the
    // counterpart's display name is resolved with a couple of batched lookups
    // rather than a join.
    const parentIds = [...new Set(conversations.map((c) => c.parentId))];
    const staffIds = [...new Set(conversations.map((c) => c.staffId))];
    const [parents, staff] = await Promise.all([
      this.prisma.parent.findMany({ where: { id: { in: parentIds } }, select: { id: true, name: true } }),
      this.prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, fullName: true } })
    ]);
    const parentMap = new Map(parents.map((p) => [p.id, p.name]));
    const staffMap = new Map(staff.map((s) => [s.id, s.fullName]));

    return conversations.map((c) => ({
      ...c,
      parentName: parentMap.get(c.parentId) || "Parent",
      staffName: staffMap.get(c.staffId) || "Staff"
    }));
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });
  }

  async sendMessage(senderId: string, senderType: string, conversationId: string, content: string) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType,
        content
      }
    });
    // Bump the conversation so the inbox list sorts by most-recently-active.
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  }

  async createConversation(parentId: string, staffId: string) {
    // Ensure unique conversation
    let conv = await this.prisma.conversation.findUnique({
      where: { parentId_staffId: { parentId, staffId } }
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { parentId, staffId }
      });
    }
    return conv;
  }
}
