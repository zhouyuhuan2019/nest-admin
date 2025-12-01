import { SetMetadata } from '@nestjs/common';

/**
 * 跳过响应转换装饰器
 * 用于需要返回原始数据的接口（如流式响应、文件下载等）
 */
export const SkipTransform = () => SetMetadata('skipTransform', true);
