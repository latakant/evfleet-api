import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PayoutStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Admin: generate weekly payouts for all ACTIVE pilots ────

  async generateWeeklyPayouts(weekStartDate: string, weekEndDate: string) {
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

    // Only pilots with positive wallet balance get a payout
    const wallets = await this.prisma.client.wallet.findMany({
      where: { balance: { gt: 0 }, pilot: { status: 'ACTIVE' } },
      include: { pilot: { select: { id: true, pilotCode: true } } },
    });

    const created = await this.prisma.client.$transaction(
      wallets.map((w) =>
        this.prisma.client.payout.create({
          data: {
            pilotId: w.pilot.id,
            amount: w.balance,
            weekStartDate: start,
            weekEndDate: end,
            status: PayoutStatus.PENDING,
          },
        }),
      ),
    );

    return { created: created.length, weekStartDate, weekEndDate };
  }

  // ── Pilot: get my payouts ───────────────────────────────────

  async getMyPayouts(userId: string, page: number, limit: number) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.client.payout.findMany({
        where: { pilotId: pilot.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.payout.count({ where: { pilotId: pilot.id } }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: list all payouts ─────────────────────────────────

  async findAll(params: { status?: PayoutStatus; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.client.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pilot: { select: { id: true, pilotCode: true, user: { select: { phone: true, name: true } } } },
        },
      }),
      this.prisma.client.payout.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: mark payout processed ───────────────────────────
  // Admin manually initiates transfer via Razorpay dashboard, then records the payout ID here.

  async markPaid(payoutId: string, razorpayPayoutId: string) {
    const payout = await this.prisma.client.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === PayoutStatus.PAID) throw new BadRequestException('Payout already marked paid');

    const wallet = await this.prisma.client.wallet.findUnique({ where: { pilotId: payout.pilotId } });
    if (!wallet) throw new NotFoundException('Pilot wallet not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PAID, razorpayPayoutId, processedAt: new Date() },
      });
      // Debit wallet balance on payout
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: Number(payout.amount) } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.PAYOUT_DEBIT,
          amount: Number(payout.amount),
          description: 'Weekly earnings payout',
          referenceId: payoutId,
        },
      });
    });

    return this.prisma.client.payout.findUnique({ where: { id: payoutId } });
  }

  async markFailed(payoutId: string, failureReason: string) {
    const payout = await this.prisma.client.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    return this.prisma.client.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.FAILED, failureReason },
    });
  }
}
