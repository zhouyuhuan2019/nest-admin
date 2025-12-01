import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
// import { RedisModule } from './redis/redis.module'; // 暂时禁用 Redis
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PrismaModule,
    // RedisModule, // 暂时禁用 Redis，需要时再启用
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
