import { Test, TestingModule } from '@nestjs/testing';
import { RentCycleStatus } from '@prisma/client';
import { RentCronService } from './rent-cron.service';
import { PrismaService } from '../../shared/services/prisma.service';

const mockPrisma = {
  client: {
    rentCycle: { updateMany: jest.fn(), findMany: jest.fn() },
    pilot: { updateMany: jest.fn() },
    vehicleToken: { updateMany: jest.fn() },
  },
};

describe('RentCronService', () => {
  let service: RentCronService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentCronService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<RentCronService>(RentCronService);
  });

  describe('markOverdueCycles', () => {
    it('does nothing when no cycles are overdue', async () => {
      mockPrisma.client.rentCycle.updateMany.mockResolvedValue({ count: 0 });
      await service.markOverdueCycles();
      expect(mockPrisma.client.rentCycle.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.client.pilot.updateMany).not.toHaveBeenCalled();
    });

    it('marks PENDING cycles older than 7 days as OVERDUE', async () => {
      mockPrisma.client.rentCycle.updateMany.mockResolvedValue({ count: 0 });
      const before = Date.now();
      await service.markOverdueCycles();

      const call = mockPrisma.client.rentCycle.updateMany.mock.calls[0][0];
      expect(call.where.status).toBe(RentCycleStatus.PENDING);
      expect(call.data.status).toBe(RentCycleStatus.OVERDUE);

      const threshold: Date = call.where.weekEndDate.lt;
      const diffMs = before - threshold.getTime();
      // Threshold should be ~7 days ago (allow 1s buffer)
      expect(diffMs).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 1000);
    });

    it('inactivates ACTIVE pilots with OVERDUE cycles', async () => {
      mockPrisma.client.rentCycle.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.client.rentCycle.findMany.mockResolvedValue([
        { pilotId: 'p1' },
        { pilotId: 'p2' },
      ]);
      mockPrisma.client.pilot.updateMany.mockResolvedValue({ count: 2 });

      await service.markOverdueCycles();

      expect(mockPrisma.client.pilot.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] }, status: 'ACTIVE' },
        data: { status: 'INACTIVE' },
      });
    });

    it('queries distinct pilotIds from OVERDUE cycles when inactivating', async () => {
      mockPrisma.client.rentCycle.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.rentCycle.findMany.mockResolvedValue([{ pilotId: 'p1' }]);
      mockPrisma.client.pilot.updateMany.mockResolvedValue({ count: 1 });

      await service.markOverdueCycles();

      expect(mockPrisma.client.rentCycle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: RentCycleStatus.OVERDUE },
          select: { pilotId: true },
          distinct: ['pilotId'],
        }),
      );
    });
  });

  describe('expireUnconfirmedTokens', () => {
    it('expires PENDING tokens past their expiresAt', async () => {
      mockPrisma.client.vehicleToken.updateMany.mockResolvedValue({ count: 3 });
      await service.expireUnconfirmedTokens();

      expect(mockPrisma.client.vehicleToken.updateMany).toHaveBeenCalledWith({
        where: { status: 'PENDING', expiresAt: { lt: expect.any(Date) } },
        data: { status: 'EXPIRED' },
      });
    });

    it('uses current timestamp for expiry check', async () => {
      mockPrisma.client.vehicleToken.updateMany.mockResolvedValue({ count: 0 });
      const before = Date.now();
      await service.expireUnconfirmedTokens();
      const after = Date.now();

      const call = mockPrisma.client.vehicleToken.updateMany.mock.calls[0][0];
      const cutoff: Date = call.where.expiresAt.lt;
      expect(cutoff.getTime()).toBeGreaterThanOrEqual(before);
      expect(cutoff.getTime()).toBeLessThanOrEqual(after);
    });

    it('does not throw when no tokens are expired', async () => {
      mockPrisma.client.vehicleToken.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.expireUnconfirmedTokens()).resolves.not.toThrow();
    });
  });
});
