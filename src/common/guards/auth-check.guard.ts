import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 认证检查守卫
 * 只在标记了 @RequireAuth() 的接口上进行鉴权
 */
@Injectable()
export class AuthCheckGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否需要认证
    const requireAuth = this.reflector.get<boolean>('requireAuth', context.getHandler());
    
    if (!requireAuth) {
      // 不需要认证，直接通过
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    if (!user) {
      throw BusinessException.unauthorized('请先登录');
    }

    // 检查角色
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles || [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        throw BusinessException.forbidden('权限不足');
      }
    }

    return true;
  }
}
