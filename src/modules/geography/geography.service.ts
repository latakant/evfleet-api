import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class GeographyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Cities ──────────────────────────────────────────────────

  getCities() {
    return this.prisma.client.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, state: true, code: true },
    });
  }

  async createCity(data: { name: string; state: string; code: string }) {
    return this.prisma.client.city.create({ data });
  }

  // ── Hubs ────────────────────────────────────────────────────

  getHubs(cityId?: string) {
    return this.prisma.client.hub.findMany({
      where: { isActive: true, ...(cityId ? { cityId } : {}) },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, address: true,
        latitude: true, longitude: true,
        city: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async getHub(id: string) {
    const hub = await this.prisma.client.hub.findUnique({
      where: { id },
      include: {
        city: { select: { id: true, name: true, code: true } },
        _count: { select: { vehicles: true, pilots: true } },
      },
    });
    if (!hub) throw new NotFoundException('Hub not found');
    return hub;
  }

  async createHub(data: {
    name: string; cityId: string; address: string;
    latitude?: number; longitude?: number;
  }) {
    const city = await this.prisma.client.city.findUnique({ where: { id: data.cityId } });
    if (!city) throw new NotFoundException('City not found');
    return this.prisma.client.hub.create({ data });
  }

  async updateHub(id: string, data: {
    name?: string; address?: string;
    latitude?: number; longitude?: number; isActive?: boolean;
  }) {
    return this.prisma.client.hub.update({ where: { id }, data });
  }
}
