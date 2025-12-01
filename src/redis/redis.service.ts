import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(options?: RedisOptions) {
    // options from Config
    this.client = new Redis(options);
    this.client.on('error', (err) => {
      console.error('Redis error', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch (e) {
      // ignore
    }
  }
}
