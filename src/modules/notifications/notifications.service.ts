import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Internal: create + optionally push FCM ──────────────────

  async send(pilotId: string, title: string, body: string, type: string, referenceId?: string) {
    const notification = await this.prisma.client.notification.create({
      data: { pilotId, title, body, type, referenceId },
    });

    // Best-effort FCM push — failure does not fail the parent transaction
    const fcmKey = process.env.FCM_SERVER_KEY;
    if (fcmKey) {
      const pilot = await this.prisma.client.pilot.findUnique({
        where: { id: pilotId },
        select: { fcmToken: true },
      });
      // Prefer direct device token; fall back to topic subscription
      const recipient = pilot?.fcmToken ?? `/topics/pilot-${pilotId}`;
      try {
        await axios.post(
          'https://fcm.googleapis.com/fcm/send',
          {
            to: recipient,
            notification: { title, body },
            data: { type, referenceId: referenceId ?? '' },
          },
          { headers: { Authorization: `key=${fcmKey}`, 'Content-Type': 'application/json' } },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`FCM push failed for pilot ${pilotId}: ${msg}`);
      }
    }

    return notification;
  }

  // ── Pilot: get my notifications ─────────────────────────────

  async getMyNotifications(userId: string, page: number, limit: number) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const skip = (page - 1) * limit;
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.client.notification.findMany({
        where: { pilotId: pilot.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.notification.count({ where: { pilotId: pilot.id } }),
      this.prisma.client.notification.count({ where: { pilotId: pilot.id, isRead: false } }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount } };
  }

  async markRead(userId: string, notificationId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const n = await this.prisma.client.notification.findUnique({ where: { id: notificationId } });
    if (!n) throw new NotFoundException('Notification not found');
    if (n.pilotId !== pilot.id) throw new NotFoundException('Notification not found');

    return this.prisma.client.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const { count } = await this.prisma.client.notification.updateMany({
      where: { pilotId: pilot.id, isRead: false },
      data: { isRead: true },
    });

    return { marked: count };
  }

  // ── Admin: list all notifications ───────────────────────────

  async findAll(params: { pilotId?: string; type?: string; page: number; limit: number }) {
    const { pilotId, type, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
      ...(pilotId ? { pilotId } : {}),
      ...(type ? { type } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.client.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pilot: { select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } } },
        },
      }),
      this.prisma.client.notification.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
