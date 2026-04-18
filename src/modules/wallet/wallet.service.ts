import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWallet(userId: string) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    let wallet = await this.prisma.client.wallet.findUnique({
      where: { pilotId: pilot.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    // Create wallet on first access if it doesn't exist
    if (!wallet) {
      wallet = await this.prisma.client.wallet.create({
        data: { pilotId: pilot.id, balance: 0 },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async getTransactions(userId: string, page: number, limit: number) {
    const pilot = await this.prisma.client.pilot.findUnique({ where: { userId } });
    if (!pilot) throw new NotFoundException('Pilot profile not found');

    const wallet = await this.prisma.client.wallet.findUnique({ where: { pilotId: pilot.id } });
    if (!wallet) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const skip = (page - 1) * limit;
    const [txns, total] = await Promise.all([
      this.prisma.client.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { data: txns, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // Admin: credit/debit pilot wallet (adjustment)
  async creditWallet(pilotId: string, amount: number, description: string, referenceId?: string) {
    const wallet = await this.prisma.client.wallet.findUnique({ where: { pilotId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.EARNINGS_CREDIT,
          amount,
          description,
          referenceId,
        },
      });
    });

    return this.prisma.client.wallet.findUnique({ where: { id: wallet.id } });
  }

  async getWalletByPilotId(pilotId: string) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { pilotId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 30 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}
