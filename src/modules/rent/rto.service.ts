import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RTOStatus, RentCycleStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class RtoService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Admin: create RTO contract after down payment confirmed ─

  async createContract(dto: {
    pilotId: string;
    vehicleId: string;
    downPayment: number;
    processingFee: number;
    weeklyInstalment: number;
    totalTenureWeeks?: number;
    startDate: string;
  }) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { id: dto.pilotId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    const vehicle = await this.prisma.client.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const tenureWeeks = dto.totalTenureWeeks ?? 52;
    const start = new Date(dto.startDate);
    const expectedEnd = new Date(start);
    expectedEnd.setDate(expectedEnd.getDate() + tenureWeeks * 7);

    return this.prisma.client.rentToOwnContract.create({
      data: {
        pilotId: dto.pilotId,
        vehicleId: dto.vehicleId,
        downPayment: dto.downPayment,
        processingFee: dto.processingFee,
        weeklyInstalment: dto.weeklyInstalment,
        totalTenureWeeks: tenureWeeks,
        startDate: start,
        expectedEndDate: expectedEnd,
        status: RTOStatus.ACTIVE,
      },
    });
  }

  async getMyContract(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot not found');

    const contract = await this.prisma.client.rentToOwnContract.findUnique({
      where: { pilotId: pilot.id },
      include: { instalments: { orderBy: { weekNumber: 'asc' } } },
    });
    if (!contract) throw new NotFoundException('No RTO contract found');
    return contract;
  }

  async findAll(params: { status?: RTOStatus; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.client.rentToOwnContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pilot: { select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } } },
        },
      }),
      this.prisma.client.rentToOwnContract.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: generate weekly instalment for all ACTIVE RTO contracts ─

  async generateWeeklyInstalments(weekNumber: number, dueDate: string) {
    const contracts = await this.prisma.client.rentToOwnContract.findMany({
      where: { status: RTOStatus.ACTIVE },
    });

    const created = await this.prisma.client.$transaction(
      contracts.map((c) =>
        this.prisma.client.rTOInstalment.create({
          data: {
            contractId: c.id,
            weekNumber,
            amount: c.weeklyInstalment,
            dueDate: new Date(dueDate),
            status: RentCycleStatus.PENDING,
          },
        }),
      ),
    );

    return { created: created.length, weekNumber, dueDate };
  }

  // ── Admin: mark instalment paid ─────────────────────────────

  async markInstalmentPaid(instalmentId: string, razorpayOrderId?: string) {
    const instalment = await this.prisma.client.rTOInstalment.findUnique({ where: { id: instalmentId } });
    if (!instalment) throw new NotFoundException('Instalment not found');
    if (instalment.status === RentCycleStatus.PAID) throw new BadRequestException('Already paid');

    const contract = await this.prisma.client.rentToOwnContract.findUnique({
      where: { id: instalment.contractId },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const wallet = await this.prisma.client.wallet.findUnique({ where: { pilotId: contract.pilotId } });

    await this.prisma.client.$transaction(async (tx) => {
      await tx.rTOInstalment.update({
        where: { id: instalmentId },
        data: { status: RentCycleStatus.PAID, paidAt: new Date(), razorpayOrderId },
      });

      const newWeeksCompleted = contract.weeksCompleted + 1;
      const isCompleted = newWeeksCompleted >= contract.totalTenureWeeks;

      await tx.rentToOwnContract.update({
        where: { id: contract.id },
        data: {
          weeksCompleted: newWeeksCompleted,
          ...(isCompleted ? { status: RTOStatus.COMPLETED, completedAt: new Date() } : {}),
        },
      });

      // Debit pilot wallet
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: Number(instalment.amount) },
            totalPaid: { increment: Number(instalment.amount) },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.RENT_DEBIT,
            amount: Number(instalment.amount),
            description: `RTO instalment week ${instalment.weekNumber}`,
            referenceId: instalmentId,
          },
        });
      }
    });

    return this.prisma.client.rTOInstalment.findUnique({ where: { id: instalmentId } });
  }

  // ── Admin: mark contract defaulted (3+ consecutive missed) ─

  async markDefaulted(contractId: string) {
    const contract = await this.prisma.client.rentToOwnContract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    return this.prisma.client.$transaction(async (tx) => {
      const updated = await tx.rentToOwnContract.update({
        where: { id: contractId },
        data: { status: RTOStatus.DEFAULTED, missedInstalments: { increment: 1 } },
      });
      await tx.pilot.update({
        where: { id: contract.pilotId },
        data: { status: 'INACTIVE' },
      });
      return updated;
    });
  }
}
