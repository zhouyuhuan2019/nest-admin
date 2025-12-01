import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserStreamController } from './user-stream.controller';
import { UserExternalController } from './user-external.controller';
import { PrismaModule } from '../prisma/prisma.module'; // optional, prisma is global so not necessary
import { UserConverter } from './converters/user.converter';
import { UserExternalService } from './services/user-external.service';

@Module({
  imports: [],
  controllers: [UserController, UserStreamController, UserExternalController],
  providers: [UserService, UserConverter, UserExternalService],
  exports: [UserExternalService], // 导出供其他模块使用
})
export class UserModule {}
