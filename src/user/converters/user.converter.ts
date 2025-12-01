import { Injectable } from '@nestjs/common';
import { CreateUserCmd } from '../cmd/create-user.cmd';
import { UpdateUserCmd } from '../cmd/update-user.cmd';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPo } from '../po/user.po';
import { UserVo } from '../vo/user.vo';
import { UserListVo } from '../vo/user-list.vo';

@Injectable()
export class UserConverter {
  // CMD -> DTO
  toCreateDto(cmd: CreateUserCmd): CreateUserDto {
    const dto = new CreateUserDto();
    dto.email = cmd.email;
    dto.name = cmd.name;
    return dto;
  }

  toUpdateDto(cmd: UpdateUserCmd): UpdateUserDto {
    const dto = new UpdateUserDto();
    dto.email = cmd.email;
    dto.name = cmd.name;
    return dto;
  }

  // PO -> VO
  toVo(po: UserPo): UserVo {
    return {
      id: po.id,
      email: po.email,
      name: po.name || undefined,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    };
  }

  toListVo(pos: UserPo[], meta: { total: number; page: number; limit: number; totalPages: number }): UserListVo {
    return {
      data: pos.map((po) => this.toVo(po)),
      meta,
    };
  }
}
