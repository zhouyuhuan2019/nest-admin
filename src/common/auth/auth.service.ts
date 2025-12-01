import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { randomBytes } from 'crypto';

export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  roles?: string[];
}

@Injectable()
export class AuthService {
  constructor(private readonly redis: RedisService) {}

  /**
   * 生成 Token
   */
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 创建用户会话
   * @param userInfo 用户信息
   * @param ttl 过期时间（秒），默认 7 天
   */
  async createSession(userInfo: UserInfo, ttl: number = 7 * 24 * 3600): Promise<string> {
    const token = this.generateToken();
    await this.redis.set(`auth:token:${token}`, userInfo, ttl);
    return token;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(token: string): Promise<UserInfo | null> {
    return await this.redis.get<UserInfo>(`auth:token:${token}`);
  }

  /**
   * 刷新会话
   */
  async refreshSession(token: string, ttl: number = 7 * 24 * 3600): Promise<boolean> {
    const userInfo = await this.getUserInfo(token);
    if (!userInfo) {
      return false;
    }
    await this.redis.set(`auth:token:${token}`, userInfo, ttl);
    return true;
  }

  /**
   * 销毁会话（登出）
   */
  async destroySession(token: string): Promise<boolean> {
    return await this.redis.del(`auth:token:${token}`);
  }

  /**
   * 验证 Token
   */
  async validateToken(token: string): Promise<boolean> {
    const userInfo = await this.getUserInfo(token);
    return userInfo !== null;
  }
}
