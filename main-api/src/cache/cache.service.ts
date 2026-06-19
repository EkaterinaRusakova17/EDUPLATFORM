import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: RedisClientType;
  private connected = false;

  constructor(config: ConfigService) {
    this.client = createClient({
      url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
    });
    this.client.on('error', (error) =>
      this.logger.warn(`Redis unavailable: ${error.message}`),
    );
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      this.logger.warn(`Starting without cache: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 60) {
    if (this.connected) {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }
  }

  async del(...keys: string[]) {
    if (this.connected && keys.length) await this.client.del(keys);
  }
}
