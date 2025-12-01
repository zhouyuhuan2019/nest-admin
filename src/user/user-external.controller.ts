import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { UserExternalService } from './services/user-external.service';

/**
 * 外部 API 调用示例 Controller
 * 演示如何在 Controller 中使用外部 API 服务
 */
@Controller('users/external')
export class UserExternalController {
  constructor(private readonly userExternalService: UserExternalService) {}

  /**
   * 获取外部用户列表
   * GET /users/external
   */
  @Get()
  async getExternalUsers() {
    return await this.userExternalService.getExternalUsers();
  }

  /**
   * 获取单个外部用户
   * GET /users/external/:id
   */
  @Get(':id')
  async getExternalUser(@Param('id') id: number) {
    return await this.userExternalService.getExternalUser(id);
  }

  /**
   * 搜索外部用户
   * GET /users/external/search?name=xxx&email=xxx
   */
  @Get('search')
  async searchExternalUsers(@Query('name') name?: string, @Query('email') email?: string) {
    return await this.userExternalService.searchExternalUsers(name, email);
  }

  /**
   * 创建外部用户
   * POST /users/external
   */
  @Post()
  async createExternalUser(@Body() data: { name: string; email: string; phone?: string }) {
    return await this.userExternalService.createExternalUser(data);
  }

  /**
   * 更新外部用户
   * PUT /users/external/:id
   */
  @Put(':id')
  async updateExternalUser(@Param('id') id: number, @Body() data: { name?: string; email?: string; phone?: string }) {
    return await this.userExternalService.updateExternalUser(id, data);
  }

  /**
   * 删除外部用户
   * DELETE /users/external/:id
   */
  @Delete(':id')
  async deleteExternalUser(@Param('id') id: number) {
    await this.userExternalService.deleteExternalUser(id);
    return { message: '删除成功' };
  }
}
