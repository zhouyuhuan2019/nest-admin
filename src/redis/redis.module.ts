import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: RedisService,
      useFactory: (config: ConfigService) => {
        return new RedisService({
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password') || undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
