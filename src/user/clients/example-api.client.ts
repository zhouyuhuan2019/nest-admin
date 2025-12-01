import {
  HttpClient,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Query,
  Body,
  Header,
} from '../../common/http/decorators/http-client.decorator';

/**
 * 示例 API 客户端
 * 演示如何使用装饰器定义第三方 API 调用
 */

// 定义响应类型
export interface ExternalUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface CreateExternalUserDto {
  name: string;
  email: string;
  phone?: string;
}

/**
 * JSONPlaceholder API 客户端示例
 * 这是一个免费的测试 API，可以直接使用
 */
@HttpClient({
  serviceName: 'jsonplaceholder',
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retries: 2,
})
export class ExampleApiClient {
  /**
   * 获取所有用户
   * GET https://jsonplaceholder.typicode.com/users
   */
  @Get('/users')
  async getUsers(): Promise<ExternalUser[]> {
    return [];
  }

  /**
   * 根据 ID 获取用户
   * GET https://jsonplaceholder.typicode.com/users/:id
   */
  @Get('/users/:id')
  async getUser(@Path('id') id: number): Promise<ExternalUser> {
    return {} as ExternalUser;
  }

  /**
   * 搜索用户（带查询参数）
   * GET https://jsonplaceholder.typicode.com/users?name=xxx
   */
  @Get('/users')
  async searchUsers(@Query('name') name?: string, @Query('email') email?: string): Promise<ExternalUser[]> {
    return [];
  }

  /**
   * 创建用户
   * POST https://jsonplaceholder.typicode.com/users
   */
  @Post('/users')
  async createUser(@Body() data: CreateExternalUserDto): Promise<ExternalUser> {
    return {} as ExternalUser;
  }

  /**
   * 更新用户
   * PUT https://jsonplaceholder.typicode.com/users/:id
   */
  @Put('/users/:id')
  async updateUser(@Path('id') id: number, @Body() data: Partial<CreateExternalUserDto>): Promise<ExternalUser> {
    return {} as ExternalUser;
  }

  /**
   * 删除用户
   * DELETE https://jsonplaceholder.typicode.com/users/:id
   */
  @Delete('/users/:id')
  async deleteUser(@Path('id') id: number): Promise<void> {
    return;
  }

  /**
   * 带自定义请求头的请求
   */
  @Get('/users/:id')
  async getUserWithAuth(@Path('id') id: number, @Header('Authorization') token: string): Promise<ExternalUser> {
    return {} as ExternalUser;
  }
}
