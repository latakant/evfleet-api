/**
 * EVFleet API — E2E Integration Tests
 *
 * Uses NestJS TestingModule + supertest. No real DB or Redis needed.
 * PrismaService and RedisService are mocked at the provider level.
 * Tests the full HTTP pipeline: throttler → JWT guard → controller → service → interceptor/filter.
 *
 * Run: npx jest --config ./test/jest-e2e.json
 */

// Set required env vars before any NestJS module initialises
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/evfleet_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';
// JwtStrategy uses JWT_SECRET || 'dev_jwt_secret_evfleet_change_in_prod' — use the default
delete process.env.JWT_SECRET;

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import helmet from 'helmet';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/services/prisma.service';
import { RedisService } from '../src/shared/services/redis.service';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { TransformInterceptor } from '../src/shared/interceptors/transform.interceptor';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const JWT_SECRET = 'dev_jwt_secret_evfleet_change_in_prod';

const pilotUser  = { id: 'u-pilot', phone: '9876543210', role: 'PILOT',      isActive: true };
const adminUser  = { id: 'u-admin', phone: '9876543211', role: 'SUPER_ADMIN', isActive: true };

// Pre-sign JWTs — same algorithm as JwtStrategy uses
const pilotToken = jwt.sign({ sub: 'u-pilot', phone: '9876543210', role: 'PILOT'      }, JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ sub: 'u-admin', phone: '9876543211', role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

// ─── Prisma mock — covers every model used across all test suites ─────────────

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),   // called by JwtStrategy.validate()
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
  },
  pilot: {
    findUnique: jest.fn(),
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
    update:     jest.fn(),
  },
  escalation: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
    update:     jest.fn(),
  },
  vehicle: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
    update:     jest.fn(),
  },
  wallet: {
    findUnique: jest.fn(),
    findMany:   jest.fn().mockResolvedValue([]),
  },
  notification: {
    findMany:   jest.fn().mockResolvedValue([]),
    count:      jest.fn().mockResolvedValue(0),
  },
  city:  { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  hub:   { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn().mockResolvedValue({ id: 'hub-1', name: 'Koramangala' }) },
  payout:            { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  rentCycle:         { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  vehicleToken:      { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  rentToOwnContract: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  kYC:               { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  client:            { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  teamLead:          { findMany: jest.fn().mockResolvedValue([]) },
  onboardingProgress: { findUnique: jest.fn() },
  refreshToken:   { create: jest.fn(), deleteMany: jest.fn() },
  $transaction:   jest.fn(),
};

const mockPrisma = { client: mockPrismaClient };

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('EVFleet API — E2E Integration', () => {
  let app: INestApplication;
  let httpServer: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService).useValue(mockPrisma)
      .overrideProvider(RedisService).useValue(mockRedis)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(helmet());
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
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: user.findUnique resolves the correct user by JWT sub
    mockPrismaClient.user.findUnique.mockImplementation(
      ({ where: { id } }: { where: { id: string } }) => {
        if (id === 'u-admin') return Promise.resolve(adminUser);
        if (id === 'u-pilot') return Promise.resolve(pilotUser);
        return Promise.resolve(null);
      },
    );
    // Redis set succeeds by default (auth.sendOtp)
    mockRedis.set.mockResolvedValue(undefined);
  });

  // ─── Suite 1: Health ─────────────────────────────────────────────────────────

  describe('Health check', () => {
    it('GET /api/health → 200 with correct envelope', async () => {
      const res = await request(httpServer).get('/api/health').expect(200);
      expect(res.body).toEqual({
        success: true,
        data: 'ok',
        message: 'Request successful',
      });
    });

    it('GET /api/health works without Authorization header (@Public)', async () => {
      await request(httpServer).get('/api/health').expect(200);
    });
  });

  // ─── Suite 2: JWT Auth Guard ─────────────────────────────────────────────────

  describe('JWT Auth Guard', () => {
    it('protected endpoint without token → 401', async () => {
      const res = await request(httpServer).get('/api/pilots/me').expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired token');
    });

    it('protected endpoint with malformed token → 401', async () => {
      const res = await request(httpServer)
        .get('/api/pilots/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('protected endpoint with expired token → 401', async () => {
      const expired = jwt.sign(
        { sub: 'u-pilot', phone: '9876543210', role: 'PILOT' },
        JWT_SECRET,
        { expiresIn: -1 }, // already expired
      );
      const res = await request(httpServer)
        .get('/api/pilots/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('valid PILOT JWT on PILOT endpoint → 200', async () => {
      mockPrismaClient.pilot.findUnique.mockResolvedValue({
        id: 'p1', userId: 'u-pilot', pilotCode: 'EV001', status: 'ACTIVE',
        isActive: true, user: pilotUser,
      });

      const res = await request(httpServer)
        .get('/api/pilots/me')
        .set('Authorization', `Bearer ${pilotToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Suite 3: DTO Validation ─────────────────────────────────────────────────

  describe('DTO Validation (ValidationPipe)', () => {
    it('POST /api/auth/send-otp with empty body → 400', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({})
        .expect(400);
      expect(res.body.success).toBe(false);
      // ValidationPipe error message should mention the field
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).toContain('phone');
    });

    it('POST /api/auth/send-otp with invalid phone (5 digits) → 400', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({ phone: '12345' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/send-otp with phone starting with 5 → 400 (must start 6–9)', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({ phone: '5876543210' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/send-otp with valid phone → 200', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('OTP sent successfully');
      // OTP stored in Redis
      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:9876543210',
        expect.any(String),
        300,
      );
    });

    it('POST /api/auth/send-otp with extra unknown field → rejected (forbidNonWhitelisted)', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210', unknown_field: 'hack' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Suite 4: Response Envelope ──────────────────────────────────────────────

  describe('Response Envelope (TransformInterceptor)', () => {
    it('success responses have { success: true, data, message }', async () => {
      const res = await request(httpServer).get('/api/health').expect(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('message', 'Request successful');
    });

    it('error responses have { success: false, data: null, message }', async () => {
      const res = await request(httpServer).get('/api/pilots/me').expect(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('message');
    });

    it('validation errors return { success: false, errors }', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({})
        .expect(400);
      // errors array or message contains validation info
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
    });

    it('paginated responses include meta with total/page/limit', async () => {
      mockPrismaClient.pilot.findMany.mockResolvedValue([]);
      mockPrismaClient.pilot.count.mockResolvedValue(0);

      // GET /api/pilots requires OPS_ADMIN+ — use adminToken
      const res = await request(httpServer)
        .get('/api/pilots')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total', 0);
    });
  });

  // ─── Suite 5: Prisma Error Filter ────────────────────────────────────────────

  describe('Prisma Error Filter (HttpExceptionFilter)', () => {
    it('PrismaClientKnownRequestError P2025 → 404', async () => {
      // JwtStrategy returns pilotUser
      // PilotsService.updateMyProfile: findUnique → finds pilot, update → throws P2025
      const mockPilot = { id: 'p1', userId: 'u-pilot', status: 'ACTIVE' };
      mockPrismaClient.pilot.findUnique.mockResolvedValue(mockPilot);

      const p2025 = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: '5.0.0' },
      );
      mockPrismaClient.pilot.update.mockRejectedValue(p2025);

      const res = await request(httpServer)
        .patch('/api/pilots/me')
        .set('Authorization', `Bearer ${pilotToken}`)
        .send({ address: 'Updated address' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Record not found');
    });

    it('PrismaClientKnownRequestError P2002 → 409', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`registrationNumber`)',
        { code: 'P2002', clientVersion: '5.0.0', meta: { target: ['registrationNumber'] } },
      );
      mockPrismaClient.vehicle.create.mockRejectedValue(p2002);

      const res = await request(httpServer)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hubId: 'hub-1',
          registrationNo: 'KA01AB1234',
          vehicleType: 'TWO_WHEELER',
          vehicleCategory: 'SCOOTER',
          brand: 'Bounce',
          model: 'Infinity E1',
          year: 2024,
          batteryType: 'CHARGING',
          speedKmph: 65,
          rangeKm: 85,
          weeklyRentB2B: 1200,
          weeklyRentB2C: 1500,
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('registrationNumber');
    });
  });

  // ─── Suite 6: Role Guard ─────────────────────────────────────────────────────

  describe('Role Guard (@Roles decorator)', () => {
    it('PILOT cannot access OPS_ADMIN/SUPER_ADMIN endpoint → 403', async () => {
      const res = await request(httpServer)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${pilotToken}`)
        .expect(403);
      expect(res.body.success).toBe(false);
    });

    it('SUPER_ADMIN can access admin endpoint → 200 (role guard passes)', async () => {
      // getDashboard calls pilot.count (x2), kYC.count, client.count, vehicleToken.count, vehicle.count (x2)
      mockPrismaClient.pilot.count.mockResolvedValue(42);
      mockPrismaClient.kYC.count.mockResolvedValue(5);
      mockPrismaClient.client.count.mockResolvedValue(10);
      mockPrismaClient.vehicleToken.count.mockResolvedValue(3);
      mockPrismaClient.vehicle.count.mockResolvedValue(100);

      const res = await request(httpServer)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPilots).toBe(42);
    });

    it('endpoint without @Roles() is accessible by any authenticated role', async () => {
      // GET /api/pilots/me has no @Roles() — any authenticated pilot can access it
      mockPrismaClient.pilot.findUnique.mockResolvedValue({
        id: 'p1', userId: 'u-pilot', pilotCode: 'EV001', status: 'ACTIVE', isActive: true,
        user: pilotUser, city: null, hub: null, onboardingProgress: null,
      });

      const res = await request(httpServer)
        .get('/api/pilots/me')
        .set('Authorization', `Bearer ${pilotToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Suite 7: @Public() decorator ────────────────────────────────────────────

  describe('@Public() decorator', () => {
    it('POST /api/auth/send-otp — no Authorization header needed', async () => {
      const res = await request(httpServer)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/verify-otp — no Authorization header needed', async () => {
      // OTP won't match (Redis returns null) → BadRequestException, but NOT 401
      const res = await request(httpServer)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '123456' });
      expect(res.status).not.toBe(401); // public route — guard never fires
    });

    it('GET /api/health — no Authorization header needed', async () => {
      await request(httpServer).get('/api/health').expect(200);
    });

    it('POST /api/auth/logout without token → 401 (logout is NOT public)', async () => {
      const res = await request(httpServer)
        .post('/api/auth/logout')
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });
});
