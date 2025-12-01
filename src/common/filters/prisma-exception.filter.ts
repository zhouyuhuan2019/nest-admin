import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message: string;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          // 唯一约束冲突
          const target = (exception.meta?.target as string[]) || [];
          message = `${target.join(', ')} 已存在`;
          status = HttpStatus.CONFLICT;
          break;
        case 'P2025':
          // 记录不存在
          message = '记录不存在';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          // 外键约束失败
          message = '关联数据不存在';
          status = HttpStatus.BAD_REQUEST;
          break;
        case 'P2014':
          // 关联数据冲突
          message = '数据存在关联，无法删除';
          status = HttpStatus.CONFLICT;
          break;
        default:
          message = '数据库操作失败';
          console.error('Prisma Error:', exception.code, exception.message);
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      message = '数据验证失败';
      console.error('Prisma Validation Error:', exception.message);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
