import 'reflect-metadata';

// 元数据键
const HTTP_CLIENT_METADATA = Symbol('HTTP_CLIENT_METADATA');
const HTTP_METHOD_METADATA = Symbol('HTTP_METHOD_METADATA');

export interface HttpClientMetadata {
  baseURL: string;
  serviceName: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

export interface HttpMethodMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  stream?: boolean;
}

/**
 * HTTP 客户端装饰器
 * @param config 客户端配置
 */
export function HttpClient(config: HttpClientMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(HTTP_CLIENT_METADATA, config, target);
  };
}

/**
 * GET 请求装饰器
 */
export function Get(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HTTP_METHOD_METADATA,
      { method: 'GET', path } as HttpMethodMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * POST 请求装饰器
 */
export function Post(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HTTP_METHOD_METADATA,
      { method: 'POST', path } as HttpMethodMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * PUT 请求装饰器
 */
export function Put(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HTTP_METHOD_METADATA,
      { method: 'PUT', path } as HttpMethodMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * DELETE 请求装饰器
 */
export function Delete(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HTTP_METHOD_METADATA,
      { method: 'DELETE', path } as HttpMethodMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * PATCH 请求装饰器
 */
export function Patch(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HTTP_METHOD_METADATA,
      { method: 'PATCH', path } as HttpMethodMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * 流式请求装饰器
 */
export function Stream(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const metadata = Reflect.getMetadata(HTTP_METHOD_METADATA, target, propertyKey) || {};
    metadata.stream = true;
    Reflect.defineMetadata(HTTP_METHOD_METADATA, metadata, target, propertyKey);
  };
}

/**
 * 路径参数装饰器
 */
export function Path(name: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const existingParams = Reflect.getMetadata('path_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, name });
    Reflect.defineMetadata('path_params', existingParams, target, propertyKey);
  };
}

/**
 * 查询参数装饰器
 */
export function Query(name?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const existingParams = Reflect.getMetadata('query_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, name });
    Reflect.defineMetadata('query_params', existingParams, target, propertyKey);
  };
}

/**
 * 请求体装饰器
 */
export function Body(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    Reflect.defineMetadata('body_param', parameterIndex, target, propertyKey);
  };
}

/**
 * 请求头装饰器
 */
export function Header(name: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const existingParams = Reflect.getMetadata('header_params', target, propertyKey) || [];
    existingParams.push({ index: parameterIndex, name });
    Reflect.defineMetadata('header_params', existingParams, target, propertyKey);
  };
}

/**
 * 请求头对象装饰器
 */
export function Headers(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    Reflect.defineMetadata('headers_param', parameterIndex, target, propertyKey);
  };
}

/**
 * 获取客户端元数据
 */
export function getHttpClientMetadata(target: any): HttpClientMetadata | undefined {
  return Reflect.getMetadata(HTTP_CLIENT_METADATA, target);
}

/**
 * 获取方法元数据
 */
export function getHttpMethodMetadata(target: any, propertyKey: string | symbol): HttpMethodMetadata | undefined {
  return Reflect.getMetadata(HTTP_METHOD_METADATA, target, propertyKey);
}
