import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './common/auth/auth.service';
import { Public } from './common/decorators/public.decorator';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @Public()
  getHello() {
    return {
      name: 'Advich NestJS Admin Panel',
      version: '1.0.0',
      environment: this.config.get('nodeEnv'),
    };
  }

  @Get('health')
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 登录示例（简化版）
   */
  @Post('auth/login')
  @Public()
  async login(@Body() body: { email: string; password: string }) {
    // TODO: 实际项目中应该验证用户名密码
    const userInfo = {
      id: 1,
      email: body.email,
      name: '测试用户',
      roles: ['user'],
    };

    const token = await this.authService.createSession(userInfo);

    return {
      token,
      user: userInfo,
    };
  }

  /**
   * 获取当前用户信息
   */
  @Get('auth/me')
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  /**
   * 登出
   */
  @Post('auth/logout')
  async logout(@CurrentUser() user: any) {
    return { message: '登出成功' };
  }
}
