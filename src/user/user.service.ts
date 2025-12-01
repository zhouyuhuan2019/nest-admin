import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserPo } from './po/user.po';
import { BusinessException } from '../common/exceptions/business.exception';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<UserPo> {
    // 示例：业务逻辑校验
    if (data.email.includes('test')) {
      throw BusinessException.badRequest('测试邮箱不允许注册');
    }

    return this.prisma.user.create({ data });
  }

  async findAll(pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    // 示例：业务规则限制
    if (limit > 100) {
      throw BusinessException.badRequest('每页最多查询 100 条数据');
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users as UserPo[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<UserPo> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      // 使用业务异常
      throw BusinessException.notFound(`用户 ID ${id} 不存在`);
    }
    return user as UserPo;
  }

  async update(id: number, data: UpdateUserDto): Promise<UserPo> {
    await this.findOne(id);

    // 示例：业务规则校验
    if (data.email && data.email.endsWith('@admin.com')) {
      throw BusinessException.forbidden('不允许修改为管理员邮箱');
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<UserPo> {
    const user = await this.findOne(id);

    // 示例：业务规则限制
    if (user.email.endsWith('@admin.com')) {
      throw BusinessException.forbidden('管理员账号不允许删除');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}

