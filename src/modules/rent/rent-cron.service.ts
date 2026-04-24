import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentCycleStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

const OVERDUE_DAYS = 7;

@Injectable()
export class RentCronService {
  private readonly logger = new Logger(RentCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Runs daily at 02:00 IST (UTC 20:30 prev day — cron in UTC)
  @Cron('30 20 * * *')
  async markOverdueCycles(): Promise<void> {
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - OVERDUE_DAYS);

    // Mark PENDING cycles older than 7 days as OVERDUE
    const { count: markedOverdue } = await this.prisma.client.rentCycle.updateMany({
      where: {
        status: RentCycleStatus.PENDING,
        weekEndDate: { lt: overdueThreshold },
      },
      data: { status: RentCycleStatus.OVERDUE },
    });

    if (markedOverdue > 0) {
      this.logger.warn(`Marked ${markedOverdue} rent cycles as OVERDUE`);

      // Set pilots with OVERDUE cycles to INACTIVE
      const overduePilots = await this.prisma.client.rentCycle.findMany({
        where: { status: RentCycleStatus.OVERDUE },
        select: { pilotId: true },
        distinct: ['pilotId'],
      });

      const pilotIds = overduePilots.map((r) => r.pilotId);
      const { count: inactivated } = await this.prisma.client.pilot.updateMany({
        where: { id: { in: pilotIds }, status: 'ACTIVE' },
        data: { status: 'INACTIVE' },
      });

      if (inactivated > 0) {
        this.logger.warn(`Set ${inactivated} pilots to INACTIVE due to overdue rent`);
      }
    }
  }

  // Runs daily at 03:00 IST — expire tokens not confirmed within 24h
  @Cron('30 21 * * *')
  async expireUnconfirmedTokens(): Promise<void> {
    const { count } = await this.prisma.client.vehicleToken.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    if (count > 0) {
      this.logger.log(`Expired ${count} unconfirmed vehicle tokens`);
    }
  }
}
