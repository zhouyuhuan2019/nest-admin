import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: LoggerService;
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor(
    private readonly loggerService: LoggerService,
    options?: RedisOptions,
  ) {
    this.logger = loggerService;
    this.logger.setContext('RedisService');
    if (!options || !options.host) {
      this.logger.warn('Redis 未配置，将跳过 Redis 功能');
      return;
    }

    try {
      this.client = new Redis({
        ...options,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis 连接失败，已达到最大重试次数');
            return null; // 停止重试
          }
          return Math.min(times * 200, 2000); // 重试间隔
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.logger.log('✅ Redis 连接成功');
        this.isEnabled = true;
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis 错误: ${err.message}`);
        this.isEnabled = false;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis 连接已关闭');
        this.isEnabled = false;
      });
    } catch (error) {
      this.logger.error(`Redis 初始化失败: ${error.message}`);
    }
  }

  async onModuleInit() {
    if (this.client) {
      try {
        await this.client.ping();
        this.isEnabled = true;
      } catch (error) {
        this.logger.warn('Redis 不可用，将以降级模式运行');
        this.isEnabled = false;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis 连接已关闭');
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * 获取 Redis 客户端
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * 检查 Redis 是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * 设置缓存（带过期时间）
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Redis SET 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Redis GET 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const keys = Array.isArray(key) ? key : [key];
      await this.client.del(...keys);
      return true;
    } catch (error) {
      this.logger.error(`Redis DEL 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      this.logger.error(`Redis EXPIRE 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 批量删除（支持模式匹配）
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      this.logger.error(`Redis DEL PATTERN 失败: ${error.message}`);
      return 0;
    }
  }

  /**
   * 增加计数
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 减少计数
   */
  async decr(key: string): Promise<number | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Redis DECR 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * Hash 操作：设置字段
   */
  async hset(key: string, field: string, value: any): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hset(key, field, serialized);
      return true;
    } catch (error) {
      this.logger.error(`Redis HSET 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * Hash 操作：获取字段
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client.hget(key, field);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Redis HGET 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * Hash 操作：获取所有字段
   */
  async hgetall<T = any>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.client.hgetall(key);
      if (!data || Object.keys(data).length === 0) return null;

      const result: any = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result as T;
    } catch (error) {
      this.logger.error(`Redis HGETALL 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取 Redis 信息
   */
  async info(): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error(`Redis INFO 失败: ${error.message}`);
      return null;
    }
  }

  // ==================== 通用缓存方法 ====================

  /**
   * 生成缓存键
   */
  private buildKey(module: string, key: string, prefix?: string): string {
    const parts = [module];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   * @param module 模块名（如 'user', 'post'）
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param ttl 过期时间（秒），默认3600
   */
  async getOrSet<T>(module: string, key: string, fetcher: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cacheKey = this.buildKey(module, key);

    // 尝试从缓存获取
    if (this.isAvailable()) {
      const cached = await this.get<T>(cacheKey);
      if (cached !== null) {
        this.logger.cache('HIT', cacheKey);
        return cached;
      }
    }

    // 缓存未命中，执行数据获取
    this.logger.cache('MISS', cacheKey);
    const data = await fetcher();

    // 写入缓存
    if (this.isAvailable() && data !== null && data !== undefined) {
      await this.set(cacheKey, data, ttl);
      this.logger.cache('SET', cacheKey);
    }

    return data;
  }

  /**
   * 设置模块缓存
   */
  async setCache<T>(module: string, key: string, value: T, ttl: number = 3600): Promise<boolean> {
    const cacheKey = this.buildKey(module, key);
    return await this.set(cacheKey, value, ttl);
  }

  /**
   * 获取模块缓存
   */
  async getCache<T>(module: string, key: string): Promise<T | null> {
    const cacheKey = this.buildKey(module, key);
    return await this.get<T>(cacheKey);
  }

  /**
   * 删除模块缓存
   */
  async delCache(module: string, key: string): Promise<boolean> {
    const cacheKey = this.buildKey(module, key);
    return await this.del(cacheKey);
  }

  /**
   * 删除模块所有缓存
   */
  async delModuleCache(module: string, pattern: string = '*'): Promise<number> {
    const fullPattern = `${module}:${pattern}`;
    return await this.delPattern(fullPattern);
  }
}
