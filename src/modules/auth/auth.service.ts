import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../../shared/services/prisma.service';
import { RedisService } from '../../shared/services/redis.service';

const OTP_TTL = 5 * 60;       // 5 minutes
const REFRESH_TTL = 7 * 24 * 3600; // 7 days

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, otp, OTP_TTL);

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (authKey && templateId) {
      try {
        await axios.post(
          'https://control.msg91.com/api/v5/otp',
          { template_id: templateId, mobile: `91${phone}`, otp },
          { headers: { authkey: authKey, 'Content-Type': 'application/json' } },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`MSG91 send failed for ${phone}: ${msg}`);
        throw new BadRequestException('Failed to send OTP. Please try again.');
      }
    } else {
      this.logger.warn(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    const stored = await this.redis.get(`otp:${phone}`);

    if (!stored) {
      throw new BadRequestException('OTP expired or not found. Please request a new OTP.');
    }
    if (stored !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }

    await this.redis.del(`otp:${phone}`);

    // Find existing user first so we know if it's a new signup
    const existing = await this.prisma.client.user.findUnique({ where: { phone } });

    let user: { id: string; phone: string; role: string; name: string | null; isActive: boolean };

    if (existing) {
      user = existing;
    } else {
      // New pilot signup — create User + Pilot + OnboardingProgress atomically
      const pilotCode = `EV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const created = await this.prisma.client.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { phone },
          select: { id: true, phone: true, role: true, name: true, isActive: true },
        });
        const pilot = await tx.pilot.create({
          data: {
            userId: newUser.id,
            pilotCode,
          },
        });
        await tx.onboardingProgress.create({ data: { pilotId: pilot.id } });
        return newUser;
      });
      user = created;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.phone, user.role);

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_evfleet_change_in_prod',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token revoked or invalid.');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive.');
    }

    const accessToken = this.jwt.sign(
      { sub: user.id, phone: user.phone, role: user.role },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.redis.del(`refresh:${userId}`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, phone, role },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_evfleet_change_in_prod',
        expiresIn: '7d',
      },
    );

    await this.redis.set(`refresh:${userId}`, refreshToken, REFRESH_TTL);

    return { accessToken, refreshToken };
  }
}
