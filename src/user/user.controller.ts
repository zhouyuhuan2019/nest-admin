import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserCmd } from './cmd/create-user.cmd';
import { UpdateUserCmd } from './cmd/update-user.cmd';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserConverter } from './converters/user.converter';
import { UserVo } from './vo/user.vo';
import { UserListVo } from './vo/user-list.vo';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAuth, RequireRoles } from '../common/decorators/require-auth.decorator';
import { BusinessException } from '../common/exceptions/business.exception';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userConverter: UserConverter,
  ) {}

  @Post()
  @RequireAuth() // 需要登录
  async create(@Body() cmd: CreateUserCmd, @CurrentUser() user: any): Promise<UserVo> {
    // user 包含当前登录用户信息
    const dto = this.userConverter.toCreateDto(cmd);
    const po = await this.userService.create(dto);
    return this.userConverter.toVo(po);
  }

  @Get()
  async list(@Query() pagination: PaginationDto, @CurrentUser() user: any): Promise<UserListVo> {
    // 不需要登录，但可以获取用户信息（如果有）
    // user 可能为 undefined
    const result = await this.userService.findAll(pagination);
    return this.userConverter.toListVo(result.data, result.meta);
  }

  @Get(':id')
  async get(@Param('id') id: number, @CurrentUser() user: any): Promise<UserVo> {
    // 不需要登录
    const po = await this.userService.findOne(id);
    return this.userConverter.toVo(po);
  }

  @Put(':id')
  @RequireAuth() // 需要登录
  async update(@Param('id') id: number, @Body() cmd: UpdateUserCmd, @CurrentUser() user: any): Promise<UserVo> {
    // 可以在这里做权限检查
    // 例如：只能修改自己的信息
    if (user.id !== id) {
      throw BusinessException.forbidden('只能修改自己的信息');
    }

    const dto = this.userConverter.toUpdateDto(cmd);
    const po = await this.userService.update(id, dto);
    return this.userConverter.toVo(po);
  }

  @Delete(':id')
  @RequireAuth() // 需要登录
  @RequireRoles('admin') // 需要管理员角色
  async remove(@Param('id') id: number): Promise<UserVo> {
    const po = await this.userService.remove(id);
    return this.userConverter.toVo(po);
  }
}

