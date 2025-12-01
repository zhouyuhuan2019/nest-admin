import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { LoggerService } from '../logger/logger.service';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestOptions extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
}

export interface StreamOptions {
  onData?: (chunk: any) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

@Injectable()
export class HttpClientService {
  private readonly logger: LoggerService;
  private clients: Map<string, AxiosInstance> = new Map();

  constructor(logger: LoggerService) {
    this.logger = logger;
    this.logger.setContext('HttpClientService');
  }

  /**
   * 创建或获取 HTTP 客户端实例
   */
  getClient(serviceName: string, config?: HttpClientConfig): AxiosInstance {
    if (this.clients.has(serviceName)) {
      return this.clients.get(serviceName)!;
    }

    const client = axios.create({
      baseURL: config?.baseURL,
      timeout: config?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });

    // 请求拦截器
    client.interceptors.request.use(
      (config) => {
        this.logger.debug(`[${serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`[${serviceName}] 请求错误:`, error.message);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    client.interceptors.response.use(
      (response) => {
        this.logger.debug(`[${serviceName}] 响应: ${response.status}`);
        return response;
      },
      async (error) => {
        const config = error.config as RequestOptions;
        const retries = config.retries || 0;
        const retryDelay = config.retryDelay || 1000;

        // 重试逻辑
        if (retries > 0 && this.shouldRetry(error)) {
          config.retries = retries - 1;
          this.logger.warn(`[${serviceName}] 重试请求，剩余次数: ${config.retries}`);
          await this.delay(retryDelay);
          return client(config);
        }

        this.logger.error(`[${serviceName}] 响应错误:`, error.message);
        return Promise.reject(error);
      },
    );

    this.clients.set(serviceName, client);
    return client;
  }

  /**
   * GET 请求
   */
  async get<T = any>(serviceName: string, url: string, options?: RequestOptions): Promise<T> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.get<T>(url, options);
    return response.data;
  }

  /**
   * POST 请求
   */
  async post<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.post<T>(url, data, options);
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.put<T>(url, data, options);
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(serviceName: string, url: string, options?: RequestOptions): Promise<T> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.delete<T>(url, options);
    return response.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.patch<T>(url, data, options);
    return response.data;
  }

  /**
   * 流式 GET 请求（SSE）
   */
  async getStream(serviceName: string, url: string, options?: RequestOptions & StreamOptions): Promise<Readable> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });

    this.logger.debug(`[${serviceName}] 开始流式 GET 请求: ${url}`);

    const response = await client.get(url, {
      ...options,
      responseType: 'stream',
    });

    const stream = response.data as Readable;

    // 添加数据监听日志
    stream.on('data', (chunk) => {
      this.logger.debug(`[${serviceName}] 流式数据块: ${chunk.toString().substring(0, 200)}...`);
      if (options?.onData) {
        options.onData(chunk);
      }
    });

    stream.on('end', () => {
      this.logger.debug(`[${serviceName}] 流式响应结束`);
      if (options?.onEnd) {
        options.onEnd();
      }
    });

    stream.on('error', (error) => {
      this.logger.error(`[${serviceName}] 流式响应错误: ${error.message}`);
      if (options?.onError) {
        options.onError(error);
      }
    });

    return stream;
  }

  /**
   * 流式 POST 请求（SSE）
   */
  async postStream(
    serviceName: string,
    url: string,
    data?: any,
    options?: RequestOptions & StreamOptions,
  ): Promise<Readable> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });

    this.logger.debug(`[${serviceName}] 开始流式 POST 请求: ${url}`);

    const response = await client.post(url, data, {
      ...options,
      responseType: 'stream',
    });

    const stream = response.data as Readable;

    // 添加数据监听日志
    stream.on('data', (chunk) => {
      this.logger.debug(`[${serviceName}] 流式数据块: ${chunk.toString().substring(0, 200)}...`);
      if (options?.onData) {
        options.onData(chunk);
      }
    });

    stream.on('end', () => {
      this.logger.debug(`[${serviceName}] 流式响应结束`);
      if (options?.onEnd) {
        options.onEnd();
      }
    });

    stream.on('error', (error) => {
      this.logger.error(`[${serviceName}] 流式响应错误: ${error.message}`);
      if (options?.onError) {
        options.onError(error);
      }
    });

    return stream;
  }

  /**
   * 下载文件
   */
  async downloadFile(serviceName: string, url: string, options?: RequestOptions): Promise<Buffer> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const response = await client.get(url, {
      ...options,
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * 上传文件
   */
  async uploadFile(
    serviceName: string,
    url: string,
    file: Buffer | Readable,
    filename: string,
    options?: RequestOptions,
  ): Promise<any> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file, filename);

    const response = await client.post(url, formData, {
      ...options,
      headers: {
        ...options?.headers,
        ...formData.getHeaders(),
      },
    });

    return response.data;
  }

  /**
   * 批量请求
   */
  async batch<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map((req) => req()));
  }

  /**
   * 并发控制的批量请求
   */
  async batchWithLimit<T = any>(requests: Array<() => Promise<T>>, limit: number = 5): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const request of requests) {
      const promise = request().then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * 获取原始响应（包含 headers 等）
   */
  async getRaw(serviceName: string, url: string, options?: RequestOptions): Promise<AxiosResponse> {
    const client = this.getClient(serviceName, { baseURL: options?.baseURL });
    return await client.get(url, options);
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
    // 网络错误或 5xx 错误重试
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清除客户端缓存
   */
  clearClient(serviceName: string): void {
    this.clients.delete(serviceName);
  }

  /**
   * 清除所有客户端缓存
   */
  clearAllClients(): void {
    this.clients.clear();
  }
}
