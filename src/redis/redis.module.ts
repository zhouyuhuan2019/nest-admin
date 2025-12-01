import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

@Global()
@Module({
  providers: [
    {
      provide: RedisService,
      useFactory: (config: ConfigService, logger: LoggerService) => {
        const enabled = config.get<boolean>('redis.enabled');
        const host = config.get<string>('redis.host');

        // 如果禁用或未配置，返回空配置的 RedisService
        if (!enabled || !host) {
          return new RedisService(logger);
        }

        return new RedisService(logger, {
          host,
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          db: config.get<number>('redis.db'),
        });
      },
      inject: [ConfigService, LoggerService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
