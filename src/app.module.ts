import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

import { SharedModule } from './shared/shared.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { PilotsModule } from './modules/pilots/pilots.module';
import { KycModule } from './modules/kyc/kyc.module';
import { GeographyModule } from './modules/geography/geography.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RentModule } from './modules/rent/rent.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EscalationsModule } from './modules/escalations/escalations.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(4000),
        CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
        JWT_SECRET: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MSG91_AUTH_KEY: Joi.string().optional().allow(''),
        MSG91_TEMPLATE_ID: Joi.string().optional().allow(''),
        RAZORPAY_KEY_ID: Joi.string().optional().allow(''),
        RAZORPAY_KEY_SECRET: Joi.string().optional().allow(''),
        RAZORPAY_WEBHOOK_SECRET: Joi.string().optional().allow(''),
        CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
        CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
        CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),
        FCM_SERVER_KEY: Joi.string().optional().allow(''),
      }),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 60 },
    ]),

    ScheduleModule.forRoot(),
    SharedModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PilotsModule,
    KycModule,
    GeographyModule,
    VehiclesModule,
    TokensModule,
    WalletModule,
    RentModule,
    OnboardingModule,
    AdminModule,
    NotificationsModule,
    EscalationsModule,
    PayoutsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
