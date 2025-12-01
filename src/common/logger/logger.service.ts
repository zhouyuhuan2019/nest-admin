import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logLevels: LogLevel[];

  constructor(private readonly configService?: ConfigService) {
    this.logLevels = this.getLogLevels();
  }

  /**
   * 设置日志上下文
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * 获取日志级别
   */
  private getLogLevels(): LogLevel[] {
    const env = this.configService?.get<string>('nodeEnv') || process.env.NODE_ENV || 'development';

    if (env === 'production') {
      return ['error', 'warn', 'log'];
    } else if (env === 'test') {
      return ['error', 'warn'];
    } else {
      return ['error', 'warn', 'log', 'debug', 'verbose'];
    }
  }

  /**
   * 判断是否应该输出该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const pid = process.pid;

    // 颜色代码
    const colors = {
      log: '\x1b[32m', // 绿色
      error: '\x1b[31m', // 红色
      warn: '\x1b[33m', // 黄色
      debug: '\x1b[36m', // 青色
      verbose: '\x1b[35m', // 紫色
    };

    const reset = '\x1b[0m';
    const color = colors[level] || reset;

    return `${color}[Nest] ${pid}  - ${timestamp}  ${level.toUpperCase().padEnd(7)} [${ctx}] ${message}${reset}`;
  }

  /**
   * 普通日志
   */
  log(message: any, context?: string) {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage('log', message, context));
    }
  }

  /**
   * 错误日志
   */
  error(message: any, trace?: string, context?: string) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
      if (trace) {
        console.error(trace);
      }
    }
  }

  /**
   * 警告日志
   */
  warn(message: any, context?: string) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * 调试日志
   */
  debug(message: any, context?: string) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * 详细日志
   */
  verbose(message: any, context?: string) {
    if (this.shouldLog('verbose')) {
      console.log(this.formatMessage('verbose', message, context));
    }
  }

  /**
   * HTTP 请求日志
   */
  http(method: string, url: string, statusCode: number, responseTime: number, ip: string, userAgent?: string) {
    const message = `[${method}] ${url} ${statusCode} - ${responseTime}ms - ${ip}${userAgent ? ` - ${userAgent.substring(0, 50)}` : ''}`;
    this.log(message, 'HTTP');
  }

  /**
   * HTTP 响应数据日志
   */
  httpResponse(method: string, url: string, data: any) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const preview = dataStr.length > 1000 ? dataStr.substring(0, 1000) + '...' : dataStr;
    this.debug(`[${method}] ${url} 响应:\n${preview}`, 'HTTP');
  }

  /**
   * 数据库查询日志
   */
  query(sql: string, duration: number) {
    const message = `Query: ${sql.substring(0, 100)}... - ${duration}ms`;
    this.debug(message, 'Database');
  }

  /**
   * 缓存日志
   */
  cache(action: 'HIT' | 'MISS' | 'SET' | 'DEL', key: string) {
    const message = `Cache ${action}: ${key}`;
    this.debug(message, 'Cache');
  }

  /**
   * 外部 API 调用日志
   */
  api(serviceName: string, method: string, url: string, statusCode?: number, duration?: number) {
    const message = `[${serviceName}] ${method} ${url}${statusCode ? ` ${statusCode}` : ''}${duration ? ` - ${duration}ms` : ''}`;
    this.log(message, 'API');
  }
}
