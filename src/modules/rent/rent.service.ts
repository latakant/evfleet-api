import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { RentCycleStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class RentService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: create weekly rent cycle for all ACTIVE pilots
  async generateWeeklyCycles(weekStartDate: string, weekEndDate: string) {
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

    const assignments = await this.prisma.client.vehicleAssignment.findMany({
      where: { isActive: true },
      include: {
        vehicle: { select: { id: true, weeklyRentB2B: true, weeklyRentB2C: true } },
        pilot: { select: { id: true, planType: true } },
      },
    });

    const created = await this.prisma.client.$transaction(
      assignments.map((a) => {
        const rentAmount = a.pilot.planType === 'B2B_POSTPAID'
          ? a.vehicle.weeklyRentB2B
          : a.vehicle.weeklyRentB2C;
        return this.prisma.client.rentCycle.create({
          data: {
            pilotId: a.pilot.id,
            vehicleId: a.vehicle.id,
            weekStartDate: start,
            weekEndDate: end,
            rentAmount,
            status: RentCycleStatus.PENDING,
          },
        });
      }),
    );

    return { created: created.length, weekStartDate, weekEndDate };
  }

  async getMyRentCycles(userId: string, page: number, limit: number) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    const skip = (page - 1) * limit;
    const [cycles, total] = await Promise.all([
      this.prisma.client.rentCycle.findMany({
        where: { pilotId: pilot.id },
        skip, take: limit, orderBy: { weekStartDate: 'desc' },
        include: { vehicle: { select: { id: true, registrationNo: true, brand: true, model: true } } },
      }),
      this.prisma.client.rentCycle.count({ where: { pilotId: pilot.id } }),
    ]);
    return { data: cycles, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAll(params: { status?: RentCycleStatus; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [cycles, total] = await Promise.all([
      this.prisma.client.rentCycle.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          pilot: { select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } } },
          vehicle: { select: { id: true, registrationNo: true } },
        },
      }),
      this.prisma.client.rentCycle.count({ where }),
    ]);
    return { data: cycles, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // Admin: mark rent cycle paid — debit pilot wallet
  async markPaid(cycleId: string, razorpayPaymentId?: string) {
    const cycle = await this.prisma.client.rentCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Rent cycle not found');
    if (cycle.status === RentCycleStatus.PAID) throw new BadRequestException('Already paid');

    const wallet = await this.prisma.client.wallet.findUnique({ where: { pilotId: cycle.pilotId } });
    if (!wallet) throw new NotFoundException('Pilot wallet not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.rentCycle.update({
        where: { id: cycleId },
        data: {
          status: RentCycleStatus.PAID,
          paidAt: new Date(),
          ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
        },
      });
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: Number(cycle.rentAmount) },
          totalPaid: { increment: Number(cycle.rentAmount) },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.RENT_DEBIT,
          amount: Number(cycle.rentAmount),
          description: `Weekly rent debit`,
          referenceId: cycleId,
        },
      });
    });

    return this.prisma.client.rentCycle.findUnique({ where: { id: cycleId } });
  }

  async waiveCycle(cycleId: string) {
    const cycle = await this.prisma.client.rentCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Rent cycle not found');
    return this.prisma.client.rentCycle.update({
      where: { id: cycleId },
      data: { status: RentCycleStatus.WAIVED },
    });
  }
}
