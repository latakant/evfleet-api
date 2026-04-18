import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { UpdatePilotDto } from './dto/update-pilot.dto';
import { PilotStatus } from '@prisma/client';

const PILOT_SELECT = {
  id: true,
  pilotCode: true,
  dateOfBirth: true,
  address: true,
  offeringType: true,
  planType: true,
  status: true,
  badgeLevel: true,
  isActive: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, phone: true, name: true, language: true } },
  city: { select: { id: true, name: true, code: true } },
  hub: { select: { id: true, name: true } },
  onboardingProgress: true,
};

@Injectable()
export class PilotsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({
      where: { userId },
      select: PILOT_SELECT,
    });
    if (!pilot) throw new NotFoundException('Pilot profile not found');
    return pilot;
  }

  async updateMyProfile(userId: string, dto: UpdatePilotDto) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    if (pilot.status === 'SUSPENDED' || pilot.status === 'TERMINATED') {
      throw new ForbiddenException('Cannot update a suspended or terminated profile');
    }

    return this.prisma.client.pilot.update({
      where: { userId },
      data: {
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.offeringType !== undefined ? { offeringType: dto.offeringType } : {}),
        ...(dto.planType !== undefined ? { planType: dto.planType } : {}),
      },
      select: PILOT_SELECT,
    });
  }

  // Admin
  async findAll(params: { status?: PilotStatus; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [pilots, total] = await Promise.all([
      this.prisma.client.pilot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          pilotCode: true,
          status: true,
          offeringType: true,
          planType: true,
          isActive: true,
          createdAt: true,
          user: { select: { id: true, phone: true, name: true } },
          city: { select: { id: true, name: true, code: true } },
          hub: { select: { id: true, name: true } },
        },
      }),
      this.prisma.client.pilot.count({ where }),
    ]);

    return { data: pilots, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const pilot = await this.prisma.client.pilot.findUnique({
      where: { id },
      select: PILOT_SELECT,
    });
    if (!pilot) throw new NotFoundException('Pilot not found');
    return pilot;
  }
}
