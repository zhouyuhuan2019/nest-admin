import { Injectable } from '@nestjs/common';
import { request, Dispatcher, Agent } from 'undici';
import { Readable } from 'stream';
import { LoggerService } from '../logger/logger.service';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
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
  private agents: Map<string, Agent> = new Map();

  constructor(logger: LoggerService) {
    this.logger = logger;
    this.logger.setContext('HttpClientService');
  }

  /**
   * 创建或获取 HTTP Agent
   */
  private getAgent(serviceName: string): Agent {
    if (this.agents.has(serviceName)) {
      return this.agents.get(serviceName)!;
    }

    const agent = new Agent({
      keepAliveTimeout: 10000,
      keepAliveMaxTimeout: 60000,
      connections: 100,
    });

    this.agents.set(serviceName, agent);
    return agent;
  }

  /**
   * 构建完整 URL
   */
  private buildUrl(baseURL: string | undefined, path: string, params?: Record<string, any>): string {
    let url = baseURL ? `${baseURL}${path}` : path;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * 执行 HTTP 请求
   */
  private async makeRequest<T>(
    serviceName: string,
    method: string,
    url: string,
    options?: RequestOptions,
    body?: any,
  ): Promise<T> {
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);

    this.logger.api(serviceName, method, fullUrl);

    const startTime = Date.now();
    let retries = options?.retries || 0;

    while (true) {
      try {
        const response = await request(fullUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          bodyTimeout: options?.timeout || 30000,
          headersTimeout: options?.timeout || 30000,
          dispatcher: agent,
        });

        const duration = Date.now() - startTime;
        this.logger.api(serviceName, method, fullUrl, response.statusCode, duration);

        if (response.statusCode >= 400) {
          const errorText = await response.body.text();
          throw new Error(`HTTP ${response.statusCode}: ${errorText}`);
        }

        const text = await response.body.text();
        return text ? JSON.parse(text) : ({} as T);
      } catch (error: any) {
        if (retries > 0 && this.shouldRetry(error)) {
          retries--;
          this.logger.warn(`[${serviceName}] 重试请求，剩余次数: ${retries}`);
          await this.delay(options?.retryDelay || 1000);
          continue;
        }

        this.logger.error(`[${serviceName}] 请求失败: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(serviceName: string, url: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(serviceName, 'GET', url, options);
  }

  /**
   * POST 请求
   */
  async post<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(serviceName, 'POST', url, options, data);
  }

  /**
   * PUT 请求
   */
  async put<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(serviceName, 'PUT', url, options, data);
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(serviceName: string, url: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(serviceName, 'DELETE', url, options);
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(serviceName: string, url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(serviceName, 'PATCH', url, options, data);
  }

  /**
   * 流式 GET 请求（SSE）
   */
  async getStream(serviceName: string, url: string, options?: RequestOptions & StreamOptions): Promise<Readable> {
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);

    this.logger.debug(`[${serviceName}] 开始流式 GET 请求: ${fullUrl}`);

    const response = await request(fullUrl, {
      method: 'GET',
      headers: options?.headers,
      dispatcher: agent,
    });

    const stream = Readable.from(response.body);

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
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);

    this.logger.debug(`[${serviceName}] 开始流式 POST 请求: ${fullUrl}`);

    const response = await request(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      dispatcher: agent,
    });

    const stream = Readable.from(response.body);

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
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);

    const response = await request(fullUrl, {
      method: 'GET',
      headers: options?.headers,
      dispatcher: agent,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of response.body) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
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
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file, filename);

    const response = await request(fullUrl, {
      method: 'POST',
      headers: {
        ...options?.headers,
        ...formData.getHeaders(),
      },
      body: formData,
      dispatcher: agent,
    });

    const text = await response.body.text();
    return text ? JSON.parse(text) : {};
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
  async getRaw(serviceName: string, url: string, options?: RequestOptions): Promise<Dispatcher.ResponseData> {
    const fullUrl = this.buildUrl(options?.baseURL, url, options?.params);
    const agent = this.getAgent(serviceName);

    return await request(fullUrl, {
      method: 'GET',
      headers: options?.headers,
      dispatcher: agent,
    });
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
   * 清除 Agent
   */
  async clearAgent(serviceName: string): Promise<void> {
    const agent = this.agents.get(serviceName);
    if (agent) {
      await agent.close();
      this.agents.delete(serviceName);
    }
  }

  /**
   * 清除所有 Agent
   */
  async clearAllAgents(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.close();
    }
    this.agents.clear();
  }

  /**
   * 销毁时清理资源
   */
  async onModuleDestroy() {
    await this.clearAllAgents();
  }
}
