import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserCmd } from './cmd/create-user.cmd';
import { UpdateUserCmd } from './cmd/update-user.cmd';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserConverter } from './converters/user.converter';
import { UserVo } from './vo/user.vo';
import { UserListVo } from './vo/user-list.vo';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userConverter: UserConverter,
  ) {}

  @Post()
  async create(@Body() cmd: CreateUserCmd): Promise<UserVo> {
    const dto = this.userConverter.toCreateDto(cmd);
    const po = await this.userService.create(dto);
    return this.userConverter.toVo(po);
  }

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<UserListVo> {
    const result = await this.userService.findAll(pagination);
    return this.userConverter.toListVo(result.data, result.meta);
  }

  @Get(':id')
  async get(@Param('id') id: number): Promise<UserVo> {
    const po = await this.userService.findOne(id);
    return this.userConverter.toVo(po);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() cmd: UpdateUserCmd): Promise<UserVo> {
    const dto = this.userConverter.toUpdateDto(cmd);
    const po = await this.userService.update(id, dto);
    return this.userConverter.toVo(po);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<UserVo> {
    const po = await this.userService.remove(id);
    return this.userConverter.toVo(po);
  }
}

