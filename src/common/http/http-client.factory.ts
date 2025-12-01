import { Injectable, Type } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { getHttpClientMetadata, getHttpMethodMetadata } from './decorators/http-client.decorator';

@Injectable()
export class HttpClientFactory {
  constructor(private readonly httpClient: HttpClientService) {}

  /**
   * 创建 HTTP 客户端代理实例
   */
  create<T>(clientClass: Type<T>): T {
    const metadata = getHttpClientMetadata(clientClass);
    if (!metadata) {
      throw new Error(`${clientClass.name} 缺少 @HttpClient 装饰器`);
    }

    const instance = new clientClass();
    const proxy = new Proxy(instance, {
      get: (target: any, prop: string) => {
        const originalMethod = target[prop];

        // 如果不是函数，直接返回
        if (typeof originalMethod !== 'function') {
          return originalMethod;
        }

        const methodMetadata = getHttpMethodMetadata(target, prop);
        if (!methodMetadata) {
          return originalMethod;
        }

        // 返回代理方法
        return async (...args: any[]) => {
          const { method, path, stream } = methodMetadata;
          const { baseURL, serviceName, timeout, headers: defaultHeaders, retries } = metadata;

          // 解析参数
          const pathParams = Reflect.getMetadata('path_params', target, prop) || [];
          const queryParams = Reflect.getMetadata('query_params', target, prop) || [];
          const bodyParamIndex = Reflect.getMetadata('body_param', target, prop);
          const headerParams = Reflect.getMetadata('header_params', target, prop) || [];
          const headersParamIndex = Reflect.getMetadata('headers_param', target, prop);

          // 构建 URL
          let url = path;
          pathParams.forEach((param: any) => {
            const value = args[param.index];
            url = url.replace(`:${param.name}`, encodeURIComponent(value));
            url = url.replace(`{${param.name}}`, encodeURIComponent(value));
          });

          // 构建查询参数
          const queryObject: any = {};
          queryParams.forEach((param: any) => {
            const value = args[param.index];
            if (value !== undefined && value !== null) {
              if (param.name) {
                queryObject[param.name] = value;
              } else if (typeof value === 'object') {
                Object.assign(queryObject, value);
              }
            }
          });

          // 构建请求体
          const body = bodyParamIndex !== undefined ? args[bodyParamIndex] : undefined;

          // 构建请求头
          const headers: any = { ...defaultHeaders };
          headerParams.forEach((param: any) => {
            const value = args[param.index];
            if (value !== undefined && value !== null) {
              headers[param.name] = value;
            }
          });
          if (headersParamIndex !== undefined) {
            Object.assign(headers, args[headersParamIndex]);
          }

          // 构建请求选项
          const options: any = {
            baseURL,
            timeout,
            headers,
            params: queryObject,
            retries,
          };

          // 执行请求
          try {
            if (stream) {
              // 流式请求
              if (method === 'GET') {
                return await this.httpClient.getStream(serviceName, url, options);
              } else if (method === 'POST') {
                return await this.httpClient.postStream(serviceName, url, body, options);
              }
            } else {
              // 普通请求
              switch (method) {
                case 'GET':
                  return await this.httpClient.get(serviceName, url, options);
                case 'POST':
                  return await this.httpClient.post(serviceName, url, body, options);
                case 'PUT':
                  return await this.httpClient.put(serviceName, url, body, options);
                case 'DELETE':
                  return await this.httpClient.delete(serviceName, url, options);
                case 'PATCH':
                  return await this.httpClient.patch(serviceName, url, body, options);
              }
            }
          } catch (error: any) {
            throw new Error(`[${serviceName}] ${method} ${url} 失败: ${error.message}`);
          }
        };
      },
    });

    return proxy as T;
  }
}
