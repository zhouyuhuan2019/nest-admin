import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }

  // 静态工厂方法，方便使用
  static badRequest(message: string) {
    return new BusinessException(message, HttpStatus.BAD_REQUEST);
  }

  static notFound(message: string) {
    return new BusinessException(message, HttpStatus.NOT_FOUND);
  }

  static forbidden(message: string) {
    return new BusinessException(message, HttpStatus.FORBIDDEN);
  }

  static unauthorized(message: string) {
    return new BusinessException(message, HttpStatus.UNAUTHORIZED);
  }

  static conflict(message: string) {
    return new BusinessException(message, HttpStatus.CONFLICT);
  }
}
