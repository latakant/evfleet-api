import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PilotStatus, TokenStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { BookTokenDto, AssignVehicleDto } from './dto/token.dto';

const TOKEN_SELECT = {
  id: true, status: true, tokenDate: true, slotTime: true,
  expiresAt: true, confirmedAt: true, assignedAt: true, cancelledAt: true, createdAt: true,
  hub: { select: { id: true, name: true, address: true } },
  vehicle: { select: { id: true, registrationNo: true, brand: true, model: true, vehicleType: true } },
};

@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  async bookToken(userId: string, dto: BookTokenDto) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');
    if (pilot.status !== PilotStatus.KYC_VERIFIED && pilot.status !== PilotStatus.TOKEN_BOOKED) {
      throw new ForbiddenException('KYC must be verified before booking a token');
    }

    // Max 1 active token at a time
    const existing = await this.prisma.client.vehicleToken.findFirst({
      where: { pilotId: pilot.id, status: { in: [TokenStatus.PENDING, TokenStatus.CONFIRMED] } },
    });
    if (existing) throw new BadRequestException('You already have an active token booking');

    const hub = await this.prisma.client.hub.findUnique({ where: { id: dto.hubId } });
    if (!hub || !hub.isActive) throw new NotFoundException('Hub not found or inactive');

    const tokenDate = new Date(dto.tokenDate);
    const expiresAt = new Date(tokenDate.getTime() + 24 * 60 * 60 * 1000);

    const token = await this.prisma.client.vehicleToken.create({
      data: {
        pilotId: pilot.id,
        hubId: dto.hubId,
        tokenDate,
        slotTime: dto.slotTime,
        expiresAt,
        status: TokenStatus.PENDING,
      },
      select: TOKEN_SELECT,
    });

    await this.prisma.client.pilot.update({
      where: { id: pilot.id },
      data: { status: PilotStatus.TOKEN_BOOKED },
    });

    await this.prisma.client.onboardingProgress.update({
      where: { pilotId: pilot.id },
      data: { tokenBooking: 'SUBMITTED' },
    });

    return token;
  }

  async getMyTokens(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');
    return this.prisma.client.vehicleToken.findMany({
      where: { pilotId: pilot.id },
      orderBy: { createdAt: 'desc' },
      select: TOKEN_SELECT,
    });
  }

  async cancelToken(userId: string, tokenId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const token = await this.prisma.client.vehicleToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token not found');
    if (token.pilotId !== pilot.id) throw new ForbiddenException('Not your token');
    if (token.status === TokenStatus.ASSIGNED) throw new BadRequestException('Cannot cancel after vehicle assigned');
    if (token.status === TokenStatus.CANCELLED) throw new BadRequestException('Already cancelled');

    // 2h cancellation window
    const bookingAge = Date.now() - token.createdAt.getTime();
    if (bookingAge > 2 * 60 * 60 * 1000) {
      throw new BadRequestException('Cancellation window (2 hours) has passed');
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.vehicleToken.update({
        where: { id: tokenId },
        data: { status: TokenStatus.CANCELLED, cancelledAt: new Date() },
      });
      await tx.pilot.update({
        where: { id: pilot.id },
        data: { status: PilotStatus.KYC_VERIFIED },
      });
      await tx.onboardingProgress.update({
        where: { pilotId: pilot.id },
        data: { tokenBooking: 'PENDING' },
      });
    });

    return { message: 'Token cancelled successfully' };
  }

  // Admin
  async findAll(params: { status?: TokenStatus; hubId?: string; page: number; limit: number }) {
    const { status, hubId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}), ...(hubId ? { hubId } : {}) };
    const [tokens, total] = await Promise.all([
      this.prisma.client.vehicleToken.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { pilot: { select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } } }, hub: { select: { id: true, name: true } } },
      }),
      this.prisma.client.vehicleToken.count({ where }),
    ]);
    return { data: tokens, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async confirmToken(tokenId: string) {
    const token = await this.prisma.client.vehicleToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token not found');
    if (token.status !== TokenStatus.PENDING) throw new BadRequestException('Token is not in PENDING state');
    return this.prisma.client.vehicleToken.update({
      where: { id: tokenId },
      data: { status: TokenStatus.CONFIRMED, confirmedAt: new Date() },
      select: TOKEN_SELECT,
    });
  }

  async assignVehicle(tokenId: string, dto: AssignVehicleDto) {
    const token = await this.prisma.client.vehicleToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token not found');
    if (token.status !== TokenStatus.CONFIRMED) throw new BadRequestException('Token must be CONFIRMED before assigning');

    const vehicle = await this.prisma.client.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status !== VehicleStatus.AVAILABLE) throw new BadRequestException('Vehicle is not available');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.vehicleToken.update({
        where: { id: tokenId },
        data: { vehicleId: dto.vehicleId, status: TokenStatus.ASSIGNED, assignedAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: dto.vehicleId }, data: { status: VehicleStatus.RENTED } });
      await tx.vehicleAssignment.create({
        data: { pilotId: token.pilotId, vehicleId: dto.vehicleId },
      });
      await tx.pilot.update({
        where: { id: token.pilotId },
        data: { status: PilotStatus.ACTIVE, joinedAt: new Date() },
      });
      await tx.onboardingProgress.update({
        where: { pilotId: token.pilotId },
        data: { tokenBooking: 'VERIFIED' },
      });
    });

    return this.prisma.client.vehicleToken.findUnique({ where: { id: tokenId }, select: TOKEN_SELECT });
  }
}
