import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';
import { LoggerService } from '../logger/logger.service';

/**
 * Token 解析中间件
 * 类似网关插件，解析请求中的 Token 并注入用户信息
 * 不做鉴权，只做解析
 */
@Injectable()
export class TokenParserMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TokenParserMiddleware');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);

    if (token) {
      try {
        // 从 Redis 获取用户信息
        const userInfo = await this.redis.get<any>(`auth:token:${token}`);

        if (userInfo) {
          // 将用户信息注入到请求对象
          req['user'] = userInfo;
          req['token'] = token;
          this.logger.debug(`Token 解析成功: 用户 ${userInfo.id} - ${userInfo.email}`);
        } else {
          this.logger.debug('Token 无效或已过期');
        }
      } catch (error) {
        this.logger.error(`Token 解析失败: ${error.message}`);
      }
    }

    next();
  }

  /**
   * 从请求头提取 Token
   */
  private extractToken(request: Request): string | null {
    // 1. 从 Authorization 头获取
    const authorization = request.headers.authorization;
    if (authorization) {
      if (authorization.startsWith('Bearer ')) {
        return authorization.substring(7);
      }
      return authorization;
    }

    // 2. 从 Cookie 获取
    const cookieToken = request.cookies?.token;
    if (cookieToken) {
      return cookieToken;
    }

    // 3. 从查询参数获取（不推荐，仅用于特殊场景）
    const queryToken = request.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }
}
