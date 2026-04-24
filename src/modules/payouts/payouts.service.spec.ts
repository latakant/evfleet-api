import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayoutStatus } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { PrismaService } from '../../shared/services/prisma.service';

const mockTx = {
  payout: { update: jest.fn() },
  wallet: { update: jest.fn() },
  walletTransaction: { create: jest.fn() },
};

const mockPrisma = {
  client: {
    pilot: { findUnique: jest.fn() },
    wallet: { findMany: jest.fn(), findUnique: jest.fn() },
    payout: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
};

describe('PayoutsService', () => {
  let service: PayoutsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<PayoutsService>(PayoutsService);
  });

  describe('generateWeeklyPayouts', () => {
    it('creates payouts for all ACTIVE pilots with positive balance', async () => {
      mockPrisma.client.wallet.findMany.mockResolvedValue([
        { balance: 500, pilot: { id: 'p1', pilotCode: 'EV001' } },
        { balance: 300, pilot: { id: 'p2', pilotCode: 'EV002' } },
      ]);
      mockPrisma.client.$transaction.mockResolvedValue([{ id: 'pay1' }, { id: 'pay2' }]);

      const result = await service.generateWeeklyPayouts('2026-04-20', '2026-04-26');
      expect(result.created).toBe(2);
      expect(result.weekStartDate).toBe('2026-04-20');
      expect(result.weekEndDate).toBe('2026-04-26');
    });

    it('returns 0 when no eligible pilots', async () => {
      mockPrisma.client.wallet.findMany.mockResolvedValue([]);
      mockPrisma.client.$transaction.mockResolvedValue([]);
      const result = await service.generateWeeklyPayouts('2026-04-20', '2026-04-26');
      expect(result.created).toBe(0);
    });

    it('filters by positive balance and ACTIVE pilot status', async () => {
      mockPrisma.client.wallet.findMany.mockResolvedValue([]);
      mockPrisma.client.$transaction.mockResolvedValue([]);

      await service.generateWeeklyPayouts('2026-04-20', '2026-04-26');
      expect(mockPrisma.client.wallet.findMany).toHaveBeenCalledWith({
        where: { balance: { gt: 0 }, pilot: { status: 'ACTIVE' } },
        include: { pilot: { select: { id: true, pilotCode: true } } },
      });
    });
  });

  describe('getMyPayouts', () => {
    it('throws if pilot not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(service.getMyPayouts('u1', 1, 10)).rejects.toThrow(NotFoundException);
    });

    it('returns paginated payouts', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.payout.findMany.mockResolvedValue([{ id: 'pay1' }]);
      mockPrisma.client.payout.count.mockResolvedValue(1);

      const result = await service.getMyPayouts('u1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('markPaid', () => {
    it('throws NotFoundException if payout not found', async () => {
      mockPrisma.client.payout.findUnique.mockResolvedValue(null);
      await expect(service.markPaid('pay1', 'rzp_123')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if already paid', async () => {
      mockPrisma.client.payout.findUnique.mockResolvedValue({ id: 'pay1', status: PayoutStatus.PAID });
      await expect(service.markPaid('pay1', 'rzp_123')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if wallet not found', async () => {
      mockPrisma.client.payout.findUnique.mockResolvedValue({
        id: 'pay1', status: PayoutStatus.PENDING, pilotId: 'p1', amount: 500,
      });
      mockPrisma.client.wallet.findUnique.mockResolvedValue(null);
      await expect(service.markPaid('pay1', 'rzp_123')).rejects.toThrow(NotFoundException);
    });

    it('atomically marks PAID, debits wallet, creates transaction record', async () => {
      mockPrisma.client.payout.findUnique
        .mockResolvedValueOnce({ id: 'pay1', status: PayoutStatus.PENDING, pilotId: 'p1', amount: 500 })
        .mockResolvedValueOnce({ id: 'pay1', status: PayoutStatus.PAID });
      mockPrisma.client.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 500 });
      mockPrisma.client.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );

      await service.markPaid('pay1', 'rzp_pay_abc');

      expect(mockTx.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PayoutStatus.PAID, razorpayPayoutId: 'rzp_pay_abc' }),
        }),
      );
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'w1' },
          data: expect.objectContaining({ balance: { decrement: 500 } }),
        }),
      );
      expect(mockTx.walletTransaction.create).toHaveBeenCalled();
    });
  });

  describe('markFailed', () => {
    it('throws if payout not found', async () => {
      mockPrisma.client.payout.findUnique.mockResolvedValue(null);
      await expect(service.markFailed('pay1', 'bank rejected')).rejects.toThrow(NotFoundException);
    });

    it('sets FAILED status and failureReason', async () => {
      mockPrisma.client.payout.findUnique.mockResolvedValue({ id: 'pay1', status: PayoutStatus.PENDING });
      mockPrisma.client.payout.update.mockResolvedValue({ id: 'pay1', status: PayoutStatus.FAILED });

      await service.markFailed('pay1', 'bank rejected');
      const call = mockPrisma.client.payout.update.mock.calls[0][0];
      expect(call.data.status).toBe(PayoutStatus.FAILED);
      expect(call.data.failureReason).toBe('bank rejected');
    });
  });
});
