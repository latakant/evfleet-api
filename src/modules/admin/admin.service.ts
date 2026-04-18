import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard KPIs ──────────────────────────────────────────

  async getDashboard() {
    const [
      totalPilots, activePilots, pendingKyc,
      totalClients, pendingTokens, totalVehicles, availableVehicles,
    ] = await Promise.all([
      this.prisma.client.pilot.count(),
      this.prisma.client.pilot.count({ where: { status: 'ACTIVE' } }),
      this.prisma.client.kYC.count({ where: { overallStatus: 'UNDER_REVIEW' } }),
      this.prisma.client.client.count({ where: { isActive: true } }),
      this.prisma.client.vehicleToken.count({ where: { status: 'PENDING' } }),
      this.prisma.client.vehicle.count({ where: { isActive: true } }),
      this.prisma.client.vehicle.count({ where: { status: 'AVAILABLE', isActive: true } }),
    ]);

    return { totalPilots, activePilots, pendingKyc, totalClients, pendingTokens, totalVehicles, availableVehicles };
  }

  // ── Team Leads ──────────────────────────────────────────────

  async getTeamLeads(hubId?: string) {
    return this.prisma.client.teamLead.findMany({
      where: { isActive: true, ...(hubId ? { hubId } : {}) },
      include: {
        user: { select: { id: true, phone: true, name: true } },
        hub: { select: { id: true, name: true } },
        _count: { select: { pilots: true } },
      },
    });
  }

  async assignTeamLead(userId: string, hubId: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.client.teamLead.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('User is already a team lead');

    const hub = await this.prisma.client.hub.findUnique({ where: { id: hubId } });
    if (!hub) throw new NotFoundException('Hub not found');

    return this.prisma.client.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role: UserRole.TEAM_LEAD } });
      return tx.teamLead.create({
        data: { userId, hubId },
        include: { user: { select: { phone: true, name: true } }, hub: { select: { name: true } } },
      });
    });
  }

  // ── Hub Managers ────────────────────────────────────────────

  async getHubManagers(hubId?: string) {
    return this.prisma.client.hubManager.findMany({
      where: { isActive: true, ...(hubId ? { hubId } : {}) },
      include: {
        user: { select: { id: true, phone: true, name: true } },
        hub: { select: { id: true, name: true } },
      },
    });
  }

  async assignHubManager(userId: string, hubId: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.client.hubManager.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('User is already a hub manager');

    return this.prisma.client.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role: UserRole.HUB_MANAGER } });
      return tx.hubManager.create({
        data: { userId, hubId },
        include: { user: { select: { phone: true, name: true } }, hub: { select: { name: true } } },
      });
    });
  }

  // ── Clients ─────────────────────────────────────────────────

  async getClients() {
    return this.prisma.client.client.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { clientPilots: true } } },
    });
  }

  async createClient(data: { name: string; clientCode: string; contactName?: string; contactPhone?: string }) {
    return this.prisma.client.client.create({ data });
  }

  async updateClient(id: string, data: { name?: string; contactName?: string; contactPhone?: string; isActive?: boolean }) {
    const c = await this.prisma.client.client.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Client not found');
    return this.prisma.client.client.update({ where: { id }, data });
  }

  async linkPilotToClient(clientId: string, pilotId: string, isPrimary = false) {
    const [client, pilot] = await Promise.all([
      this.prisma.client.client.findUnique({ where: { id: clientId } }),
      this.prisma.client.pilot.findUnique({ where: { id: pilotId } }),
    ]);
    if (!client) throw new NotFoundException('Client not found');
    if (!pilot) throw new NotFoundException('Pilot not found');

    return this.prisma.client.clientPilot.upsert({
      where: { clientId_pilotId: { clientId, pilotId } },
      update: { isPrimary },
      create: { clientId, pilotId, isPrimary },
    });
  }
}
