import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6382', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.client.on('error', (err) => {
      this.logger.error(`[Redis] Connection error: ${err.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Redis] Cannot connect.\n  REDIS_URL: ${process.env.REDIS_URL}\n  Error: ${msg}`);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
