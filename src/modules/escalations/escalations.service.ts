import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EscalationCategory, EscalationPriority, EscalationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

const SLA_HOURS: Record<EscalationPriority, number> = {
  LOW: 72,
  MEDIUM: 24,
  HIGH: 4,
  CRITICAL: 1,
};

const ESCALATION_SELECT = {
  id: true,
  category: true,
  priority: true,
  description: true,
  attachmentUrl: true,
  status: true,
  slaDeadlineAt: true,
  resolvedAt: true,
  resolution: true,
  createdAt: true,
  updatedAt: true,
  raisedByPilot: {
    select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } },
  },
};

@Injectable()
export class EscalationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pilot: raise escalation ─────────────────────────────────

  async create(userId: string, dto: {
    category: EscalationCategory;
    priority?: EscalationPriority;
    description: string;
    attachmentUrl?: string;
  }) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');
    if (pilot.status === 'SUSPENDED' || pilot.status === 'TERMINATED') {
      throw new ForbiddenException('Suspended or terminated pilots cannot raise escalations');
    }

    const priority = dto.priority ?? EscalationPriority.MEDIUM;
    const slaDeadlineAt = new Date(Date.now() + SLA_HOURS[priority] * 60 * 60 * 1000);

    return this.prisma.client.escalation.create({
      data: {
        raisedByPilotId: pilot.id,
        category: dto.category,
        priority,
        description: dto.description,
        attachmentUrl: dto.attachmentUrl,
        slaDeadlineAt,
      },
      select: ESCALATION_SELECT,
    });
  }

  async getMyEscalations(userId: string, page: number, limit: number) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.client.escalation.findMany({
        where: { raisedByPilotId: pilot.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: ESCALATION_SELECT,
      }),
      this.prisma.client.escalation.count({ where: { raisedByPilotId: pilot.id } }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin ───────────────────────────────────────────────────

  async findAll(params: {
    status?: EscalationStatus;
    priority?: EscalationPriority;
    category?: EscalationCategory;
    page: number;
    limit: number;
  }) {
    const { status, priority, category, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.escalation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        select: ESCALATION_SELECT,
      }),
      this.prisma.client.escalation.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const e = await this.prisma.client.escalation.findUnique({ where: { id }, select: ESCALATION_SELECT });
    if (!e) throw new NotFoundException('Escalation not found');
    return e;
  }

  async assign(id: string, assignedToUserId: string) {
    const e = await this.prisma.client.escalation.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Escalation not found');
    return this.prisma.client.escalation.update({
      where: { id },
      data: { assignedToUserId, status: EscalationStatus.IN_PROGRESS },
      select: ESCALATION_SELECT,
    });
  }

  async resolve(id: string, resolution: string) {
    const e = await this.prisma.client.escalation.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Escalation not found');
    if (e.status === EscalationStatus.CLOSED) {
      throw new ForbiddenException('Escalation is already closed');
    }
    return this.prisma.client.escalation.update({
      where: { id },
      data: { status: EscalationStatus.RESOLVED, resolvedAt: new Date(), resolution },
      select: ESCALATION_SELECT,
    });
  }

  async close(id: string) {
    const e = await this.prisma.client.escalation.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Escalation not found');
    return this.prisma.client.escalation.update({
      where: { id },
      data: { status: EscalationStatus.CLOSED },
      select: ESCALATION_SELECT,
    });
  }
}
