import { SetMetadata } from '@nestjs/common';

/**
 * 公开接口装饰器
 * 标记为公开的接口不需要认证
 */
export const Public = () => SetMetadata('isPublic', true);
