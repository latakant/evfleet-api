import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

function validateSecrets(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const name of required) {
    if (!process.env[name]) {
      const msg = `[BOOT] ${name} is not set.`;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
      }
      console.warn(`\x1b[33m${msg}\x1b[0m`);
    }
  }
}

async function bootstrap() {
  validateSecrets();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('EVFleet API')
      .setDescription('EV Fleet & Delivery Partner Platform — API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT-auth',
      )
      .addTag('Health', 'Health check')
      .addTag('Auth', 'Authentication (OTP + JWT)')
      .addTag('Users', 'User management')
      .addTag('Pilots', 'Pilot profiles')
      .addTag('KYC', 'KYC document management')
      .addTag('Geography', 'Cities and hubs')
      .addTag('Offerings', 'Offering types and plans')
      .addTag('Teams', 'Team leads and hub managers')
      .addTag('Clients', 'Client management')
      .addTag('Vehicles', 'Vehicle and token management')
      .addTag('Onboarding', 'Pilot onboarding progress')
      .addTag('Wallet', 'Wallet and transactions')
      .addTag('Rent', 'Rent cycles')
      .addTag('RTO', 'Rent-to-Own contracts and instalments')
      .addTag('Payouts', 'Pilot earnings payouts')
      .addTag('Escalations', 'Issue escalation management')
      .addTag('Notifications', 'Pilot push notifications')
      .addTag('Admin', 'Admin panel')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`EVFleet API running on http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger: http://localhost:${port}/docs`);
  }
}

bootstrap();
