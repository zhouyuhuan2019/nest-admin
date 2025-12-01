import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response as ExpressResponse } from 'express';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | any> {
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // 1. 检查是否是流式响应（StreamableFile）
        if (data instanceof StreamableFile) {
          return data;
        }

        // 2. 检查是否是 SSE (Server-Sent Events) 流式响应
        if (response.getHeader('Content-Type') === 'text/event-stream') {
          return data;
        }

        // 3. 检查是否是文件下载
        if (response.getHeader('Content-Disposition')) {
          return data;
        }

        // 4. 检查是否手动设置了不需要包装（通过自定义装饰器）
        const skipTransform = Reflect.getMetadata('skipTransform', context.getHandler());
        if (skipTransform) {
          return data;
        }

        // 5. 检查响应头是否已经设置为流式
        const contentType = response.getHeader('Content-Type');
        if (
          contentType &&
          (contentType.toString().includes('stream') ||
            contentType.toString().includes('octet-stream') ||
            contentType.toString().includes('multipart'))
        ) {
          return data;
        }

        // 6. 普通响应，包装成统一格式
        return {
          data,
          statusCode: response.statusCode,
          message: '操作成功',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
