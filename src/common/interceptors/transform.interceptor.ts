import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Response as ExpressResponse, Request } from 'express';
import { LoggerService } from '../logger/logger.service';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('TransformInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | any> {
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // 请求信息
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';

    return next.handle().pipe(
      map((data) => {
        const responseTime = Date.now() - startTime;

        // 1. 检查是否是流式响应（StreamableFile）
        if (data instanceof StreamableFile) {
          this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);
          this.logger.log(`流式文件响应 - StreamableFile`);
          return data;
        }

        // 2. 检查是否是 SSE (Server-Sent Events) 流式响应
        if (response.getHeader('Content-Type') === 'text/event-stream') {
          this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);
          this.logger.log(`SSE 流式响应 - 数据将实时推送 ${JSON.stringify(data)}`);
          return data;
        }

        // 3. 检查是否是文件下载
        if (response.getHeader('Content-Disposition')) {
          this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);
          this.logger.log(`文件下载响应 - ${response.getHeader('Content-Disposition')}`);
          return data;
        }

        // 4. 检查是否手动设置了不需要包装（通过自定义装饰器）
        const skipTransform = Reflect.getMetadata('skipTransform', context.getHandler());
        if (skipTransform) {
          this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);
          this.logger.log(`跳过响应包装 - 原始数据:\n${JSON.stringify(data, null, 2).substring(0, 500)}`);
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
          this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);
          this.logger.log(`流式响应 - Content-Type: ${contentType}`);
          return data;
        }

        // 6. 普通响应，包装成统一格式
        const result = {
          data,
          statusCode: response.statusCode,
          message: '操作成功',
          timestamp: new Date().toISOString(),
        };

        // 打印响应日志
        this.logger.http(method, url, response.statusCode, responseTime, ip, userAgent);

        // 打印响应数据
        const dataStr = JSON.stringify(result, null, 2);
        const preview = dataStr.length > 1000 ? dataStr.substring(0, 1000) + '...' : dataStr;
        this.logger.log(`响应数据:\n${preview}`);

        return result;
      }),
      tap({
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `[${method}] ${url} ${error.status || 500} - ${responseTime}ms - ${ip} - 错误: ${error.message}`,
          );
        },
      }),
    );
  }
}

