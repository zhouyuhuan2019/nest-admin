import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './common/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HttpClientModule } from './common/http/http-client.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    LoggerModule,
    AuthModule,
    PrismaModule,
    RedisModule,
    HttpClientModule,
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
