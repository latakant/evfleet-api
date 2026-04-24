import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RTOStatus, RentCycleStatus } from '@prisma/client';
import { RtoService } from './rto.service';
import { PrismaService } from '../../shared/services/prisma.service';

const mockTx = {
  rTOInstalment: { update: jest.fn() },
  rentToOwnContract: { update: jest.fn() },
  wallet: { update: jest.fn() },
  walletTransaction: { create: jest.fn() },
  pilot: { update: jest.fn() },
};

const mockPrisma = {
  client: {
    pilot: { findUnique: jest.fn() },
    vehicle: { findUnique: jest.fn() },
    wallet: { findUnique: jest.fn() },
    rentToOwnContract: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    rTOInstalment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
};

describe('RtoService', () => {
  let service: RtoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RtoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<RtoService>(RtoService);
  });

  describe('createContract', () => {
    const baseDto = {
      pilotId: 'p1',
      vehicleId: 'v1',
      downPayment: 5000,
      processingFee: 500,
      weeklyInstalment: 1000,
      startDate: '2026-04-24',
    };

    it('throws NotFoundException if pilot not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(service.createContract(baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if vehicle not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.vehicle.findUnique.mockResolvedValue(null);
      await expect(service.createContract(baseDto)).rejects.toThrow(NotFoundException);
    });

    it('defaults tenure to 52 weeks', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.vehicle.findUnique.mockResolvedValue({ id: 'v1' });
      mockPrisma.client.rentToOwnContract.create.mockResolvedValue({ id: 'c1' });

      await service.createContract(baseDto);
      const call = mockPrisma.client.rentToOwnContract.create.mock.calls[0][0];
      expect(call.data.totalTenureWeeks).toBe(52);
    });

    it('computes expectedEndDate as startDate + tenure * 7 days', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.vehicle.findUnique.mockResolvedValue({ id: 'v1' });
      mockPrisma.client.rentToOwnContract.create.mockResolvedValue({ id: 'c1' });

      await service.createContract({ ...baseDto, totalTenureWeeks: 4 });
      const call = mockPrisma.client.rentToOwnContract.create.mock.calls[0][0];

      const expectedEnd = new Date('2026-04-24');
      expectedEnd.setDate(expectedEnd.getDate() + 4 * 7);
      expect(call.data.expectedEndDate.getTime()).toBe(expectedEnd.getTime());
    });

    it('sets status ACTIVE on creation', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.vehicle.findUnique.mockResolvedValue({ id: 'v1' });
      mockPrisma.client.rentToOwnContract.create.mockResolvedValue({ id: 'c1' });

      await service.createContract(baseDto);
      const call = mockPrisma.client.rentToOwnContract.create.mock.calls[0][0];
      expect(call.data.status).toBe(RTOStatus.ACTIVE);
    });
  });

  describe('generateWeeklyInstalments', () => {
    it('creates instalments for all ACTIVE contracts', async () => {
      mockPrisma.client.rentToOwnContract.findMany.mockResolvedValue([
        { id: 'c1', weeklyInstalment: 1000 },
        { id: 'c2', weeklyInstalment: 1200 },
      ]);
      mockPrisma.client.$transaction.mockResolvedValue([{ id: 'i1' }, { id: 'i2' }]);

      const result = await service.generateWeeklyInstalments(1, '2026-04-28');
      expect(result.created).toBe(2);
      expect(result.weekNumber).toBe(1);
    });

    it('queries only ACTIVE contracts', async () => {
      mockPrisma.client.rentToOwnContract.findMany.mockResolvedValue([]);
      mockPrisma.client.$transaction.mockResolvedValue([]);

      await service.generateWeeklyInstalments(1, '2026-04-28');
      expect(mockPrisma.client.rentToOwnContract.findMany).toHaveBeenCalledWith({
        where: { status: RTOStatus.ACTIVE },
      });
    });
  });

  describe('markInstalmentPaid', () => {
    it('throws NotFoundException if instalment not found', async () => {
      mockPrisma.client.rTOInstalment.findUnique.mockResolvedValue(null);
      await expect(service.markInstalmentPaid('ins1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if already paid', async () => {
      mockPrisma.client.rTOInstalment.findUnique.mockResolvedValue({
        id: 'ins1', status: RentCycleStatus.PAID,
      });
      await expect(service.markInstalmentPaid('ins1')).rejects.toThrow(BadRequestException);
    });

    it('marks instalment PAID and increments weeksCompleted', async () => {
      mockPrisma.client.rTOInstalment.findUnique
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PENDING, contractId: 'c1', amount: 1000, weekNumber: 1 })
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PAID });
      mockPrisma.client.rentToOwnContract.findUnique.mockResolvedValue({
        id: 'c1', pilotId: 'p1', weeksCompleted: 0, totalTenureWeeks: 52,
      });
      mockPrisma.client.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 5000 });
      mockPrisma.client.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );

      await service.markInstalmentPaid('ins1');
      expect(mockTx.rentToOwnContract.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ weeksCompleted: 1 }) }),
      );
    });

    it('auto-completes contract on final (week 52) instalment', async () => {
      mockPrisma.client.rTOInstalment.findUnique
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PENDING, contractId: 'c1', amount: 1000, weekNumber: 52 })
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PAID });
      mockPrisma.client.rentToOwnContract.findUnique.mockResolvedValue({
        id: 'c1', pilotId: 'p1', weeksCompleted: 51, totalTenureWeeks: 52,
      });
      mockPrisma.client.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 5000 });
      mockPrisma.client.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );

      await service.markInstalmentPaid('ins1');
      expect(mockTx.rentToOwnContract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RTOStatus.COMPLETED }),
        }),
      );
    });

    it('does not complete contract before final week', async () => {
      mockPrisma.client.rTOInstalment.findUnique
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PENDING, contractId: 'c1', amount: 1000, weekNumber: 10 })
        .mockResolvedValueOnce({ id: 'ins1', status: RentCycleStatus.PAID });
      mockPrisma.client.rentToOwnContract.findUnique.mockResolvedValue({
        id: 'c1', pilotId: 'p1', weeksCompleted: 9, totalTenureWeeks: 52,
      });
      mockPrisma.client.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 5000 });
      mockPrisma.client.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );

      await service.markInstalmentPaid('ins1');
      const call = mockTx.rentToOwnContract.update.mock.calls[0][0];
      expect(call.data.status).toBeUndefined();
    });
  });

  describe('markDefaulted', () => {
    it('throws NotFoundException if contract not found', async () => {
      mockPrisma.client.rentToOwnContract.findUnique.mockResolvedValue(null);
      await expect(service.markDefaulted('c1')).rejects.toThrow(NotFoundException);
    });

    it('atomically sets DEFAULTED and marks pilot INACTIVE', async () => {
      mockPrisma.client.rentToOwnContract.findUnique.mockResolvedValue({ id: 'c1', pilotId: 'p1' });
      mockTx.rentToOwnContract.update.mockResolvedValue({ id: 'c1', status: RTOStatus.DEFAULTED });
      mockPrisma.client.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );

      await service.markDefaulted('c1');

      expect(mockTx.rentToOwnContract.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: RTOStatus.DEFAULTED }) }),
      );
      expect(mockTx.pilot.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'INACTIVE' },
      });
    });
  });
});
