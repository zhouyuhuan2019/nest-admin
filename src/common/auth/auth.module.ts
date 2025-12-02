import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { TokenParserMiddleware } from '../middleware/token-parser.middleware';
import { AuthCheckGuard } from '../guards/auth-check.guard';

@Global()
@Module({
  providers: [
    AuthService,
    // 使用选择性鉴权守卫
    {
      provide: APP_GUARD,
      useClass: AuthCheckGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 对所有路由应用 Token 解析中间件
    consumer.apply(TokenParserMiddleware).forRoutes('*');
  }
}
