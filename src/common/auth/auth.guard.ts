import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否标记为公开接口
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw BusinessException.unauthorized('未提供认证令牌');
    }

    // 从 Redis 获取用户信息
    const userInfo = await this.redis.get<any>(`auth:token:${token}`);

    if (!userInfo) {
      throw BusinessException.unauthorized('令牌无效或已过期');
    }

    // 将用户信息附加到请求对象
    request['user'] = userInfo;

    return true;
  }

  /**
   * 从请求头提取 Token
   */
  private extractToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    // 支持 Bearer Token
    if (authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    // 直接使用 Token
    return authorization;
  }
}
