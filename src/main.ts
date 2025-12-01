import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/logger/logger.service';

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get services
  const logger = app.get(LoggerService);
  const config = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters (注意顺序：从具体到通用)
  app.useGlobalFilters(
    new AllExceptionsFilter(), // 最后兜底
    new PrismaExceptionFilter(), // Prisma 异常
    new HttpExceptionFilter(), // HTTP 异常
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(logger));

  // CORS
  app.enableCors();

  // Start server
  const port = config.get<number>('port') || 3000;
  const env = config.get<string>('nodeEnv');

  await app.listen(port);
  
  logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`📦 Environment: ${env}`, 'Bootstrap');
}

bootstrap();
