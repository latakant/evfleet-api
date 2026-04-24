import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../shared/services/prisma.service';

const mockPrisma = {
  client: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pilot: { findUnique: jest.fn() },
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
    delete process.env.FCM_SERVER_KEY; // no HTTP calls in unit tests
  });

  describe('send', () => {
    it('creates a notification record', async () => {
      const notification = { id: 'n1', pilotId: 'p1', title: 'T', body: 'B', type: 'GENERAL', isRead: false };
      mockPrisma.client.notification.create.mockResolvedValue(notification);

      const result = await service.send('p1', 'T', 'B', 'GENERAL');
      expect(mockPrisma.client.notification.create).toHaveBeenCalledWith({
        data: { pilotId: 'p1', title: 'T', body: 'B', type: 'GENERAL', referenceId: undefined },
      });
      expect(result).toEqual(notification);
    });

    it('passes referenceId when provided', async () => {
      mockPrisma.client.notification.create.mockResolvedValue({ id: 'n1' });
      await service.send('p1', 'T', 'B', 'RENT', 'rc1');
      const call = mockPrisma.client.notification.create.mock.calls[0][0];
      expect(call.data.referenceId).toBe('rc1');
    });
  });

  describe('getMyNotifications', () => {
    it('throws NotFoundException if pilot profile not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(service.getMyNotifications('u1', 1, 10)).rejects.toThrow(NotFoundException);
    });

    it('returns paginated notifications with unreadCount', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      mockPrisma.client.notification.count
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(2); // unreadCount

      const result = await service.getMyNotifications('u1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(5);
      expect(result.meta.unreadCount).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('computes correct skip for page 2', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.findMany.mockResolvedValue([]);
      mockPrisma.client.notification.count.mockResolvedValue(0);

      await service.getMyNotifications('u1', 2, 10);
      expect(mockPrisma.client.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('markRead', () => {
    it('throws if pilot not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(service.markRead('u1', 'n1')).rejects.toThrow(NotFoundException);
    });

    it('throws if notification not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.findUnique.mockResolvedValue(null);
      await expect(service.markRead('u1', 'n1')).rejects.toThrow(NotFoundException);
    });

    it('throws if notification belongs to a different pilot', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.findUnique.mockResolvedValue({ id: 'n1', pilotId: 'p2' });
      await expect(service.markRead('u1', 'n1')).rejects.toThrow(NotFoundException);
    });

    it('marks notification as read', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.findUnique.mockResolvedValue({ id: 'n1', pilotId: 'p1' });
      mockPrisma.client.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

      const result = await service.markRead('u1', 'n1');
      expect(result.isRead).toBe(true);
      expect(mockPrisma.client.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllRead', () => {
    it('throws if pilot not found', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue(null);
      await expect(service.markAllRead('u1')).rejects.toThrow(NotFoundException);
    });

    it('marks all unread notifications as read', async () => {
      mockPrisma.client.pilot.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.client.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead('u1');
      expect(result.marked).toBe(3);
      expect(mockPrisma.client.notification.updateMany).toHaveBeenCalledWith({
        where: { pilotId: 'p1', isRead: false },
        data: { isRead: true },
      });
    });
  });
});
