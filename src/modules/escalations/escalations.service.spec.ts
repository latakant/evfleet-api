import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EscalationCategory, EscalationPriority, EscalationStatus } from '@prisma/client';
import { EscalationsService } from './escalations.service';
import { PrismaService } from '../../shared/services/prisma.service';

const mockPrisma = {
  client: {
    pilot: { findUnique: jest.fn() },
    escalation: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
};

describe('EscalationsService', () => {
  let service: EscalationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<EscalationsService>(EscalationsService);
  });

  describe('create', () => {
    it('throws NotFoundException if pilot not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(
        service.create('u1', { category: EscalationCategory.VEHICLE_BREAKDOWN, description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for suspended pilots', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1', status: 'SUSPENDED' });
      await expect(
        service.create('u1', { category: EscalationCategory.VEHICLE_BREAKDOWN, description: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for terminated pilots', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1', status: 'TERMINATED' });
      await expect(
        service.create('u1', { category: EscalationCategory.PAYMENT_ISSUE, description: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('defaults priority to MEDIUM when not provided', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' });
      mockPrisma.client.escalation.create.mockResolvedValue({ id: 'e1' });

      await service.create('u1', { category: EscalationCategory.PAYMENT_ISSUE, description: 'test' });
      const call = mockPrisma.client.escalation.create.mock.calls[0][0];
      expect(call.data.priority).toBe(EscalationPriority.MEDIUM);
    });

    it('sets SLA deadline 4 hours for HIGH priority', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' });
      mockPrisma.client.escalation.create.mockResolvedValue({ id: 'e1' });

      const before = Date.now();
      await service.create('u1', {
        category: EscalationCategory.VEHICLE_BREAKDOWN,
        priority: EscalationPriority.HIGH,
        description: 'brake issue',
      });
      const after = Date.now();

      const call = mockPrisma.client.escalation.create.mock.calls[0][0];
      const slaDeltaMs = call.data.slaDeadlineAt.getTime() - before;
      expect(slaDeltaMs).toBeGreaterThanOrEqual(4 * 60 * 60 * 1000 - 1000);
      expect(slaDeltaMs).toBeLessThanOrEqual(4 * 60 * 60 * 1000 + (after - before));
    });

    it('sets SLA deadline 72 hours for LOW priority', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1', status: 'ACTIVE' });
      mockPrisma.client.escalation.create.mockResolvedValue({ id: 'e1' });

      const before = Date.now();
      await service.create('u1', {
        category: EscalationCategory.OTHER,
        priority: EscalationPriority.LOW,
        description: 'minor issue',
      });

      const call = mockPrisma.client.escalation.create.mock.calls[0][0];
      const slaDeltaMs = call.data.slaDeadlineAt.getTime() - before;
      expect(slaDeltaMs).toBeGreaterThanOrEqual(72 * 60 * 60 * 1000 - 1000);
    });
  });

  describe('findOne', () => {
    it('throws if escalation not found', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue(null);
      await expect(service.findOne('e1')).rejects.toThrow(NotFoundException);
    });

    it('returns escalation', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue({ id: 'e1' });
      const result = await service.findOne('e1');
      expect(result).toEqual({ id: 'e1' });
    });
  });

  describe('assign', () => {
    it('throws if escalation not found', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue(null);
      await expect(service.assign('e1', 'u2')).rejects.toThrow(NotFoundException);
    });

    it('sets status to IN_PROGRESS and records assignee', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue({ id: 'e1' });
      mockPrisma.client.escalation.update.mockResolvedValue({ id: 'e1', status: EscalationStatus.IN_PROGRESS });

      await service.assign('e1', 'u2');
      const call = mockPrisma.client.escalation.update.mock.calls[0][0];
      expect(call.data.status).toBe(EscalationStatus.IN_PROGRESS);
      expect(call.data.assignedToUserId).toBe('u2');
    });
  });

  describe('resolve', () => {
    it('throws if escalation not found', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue(null);
      await expect(service.resolve('e1', 'fixed')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if already closed', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue({ id: 'e1', status: EscalationStatus.CLOSED });
      await expect(service.resolve('e1', 'fixed')).rejects.toThrow(ForbiddenException);
    });

    it('sets RESOLVED + resolvedAt + resolution', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue({ id: 'e1', status: EscalationStatus.IN_PROGRESS });
      mockPrisma.client.escalation.update.mockResolvedValue({ id: 'e1', status: EscalationStatus.RESOLVED });

      await service.resolve('e1', 'brake replaced');
      const call = mockPrisma.client.escalation.update.mock.calls[0][0];
      expect(call.data.status).toBe(EscalationStatus.RESOLVED);
      expect(call.data.resolvedAt).toBeInstanceOf(Date);
      expect(call.data.resolution).toBe('brake replaced');
    });
  });

  describe('close', () => {
    it('throws if not found', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue(null);
      await expect(service.close('e1')).rejects.toThrow(NotFoundException);
    });

    it('sets CLOSED status', async () => {
      mockPrisma.client.escalation.findUnique.mockResolvedValue({ id: 'e1' });
      mockPrisma.client.escalation.update.mockResolvedValue({ id: 'e1', status: EscalationStatus.CLOSED });

      await service.close('e1');
      const call = mockPrisma.client.escalation.update.mock.calls[0][0];
      expect(call.data.status).toBe(EscalationStatus.CLOSED);
    });
  });
});
