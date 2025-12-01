import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: RedisService,
      useFactory: (config: ConfigService) => {
        const enabled = config.get<boolean>('redis.enabled');
        const host = config.get<string>('redis.host');

        // 如果禁用或未配置，返回空配置的 RedisService
        if (!enabled || !host) {
          return new RedisService();
        }

        return new RedisService({
          host,
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          db: config.get<number>('redis.db'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
