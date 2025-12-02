import { SetMetadata } from '@nestjs/common';

/**
 * 需要认证装饰器
 * 标记需要认证的接口
 */
export const RequireAuth = () => SetMetadata('requireAuth', true);

/**
 * 需要角色装饰器
 * 标记需要特定角色的接口
 */
export const RequireRoles = (...roles: string[]) => SetMetadata('roles', roles);
