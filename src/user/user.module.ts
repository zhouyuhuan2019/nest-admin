import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserStreamController } from './user-stream.controller';
import { PrismaModule } from '../prisma/prisma.module'; // optional, prisma is global so not necessary
import { UserConverter } from './converters/user.converter';

@Module({
  imports: [],
  controllers: [UserController, UserStreamController],
  providers: [UserService, UserConverter],
})
export class UserModule {}
