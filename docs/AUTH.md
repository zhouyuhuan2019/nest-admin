# 认证机制使用文档

## 概述

基于 Token 的简单认证机制，Token 存储在 Redis 中。

## 工作原理

1. 用户登录后生成 Token
2. Token 和用户信息存储在 Redis（默认 7 天过期）
3. 后续请求在 Header 中携带 Token
4. AuthGuard 验证 Token 并注入用户信息

## 使用方式

### 1. 公开接口（不需要认证）

使用 `@Public()` 装饰器：

```typescript
import { Public } from '../common/decorators/public.decorator';

@Controller('posts')
export class PostController {
  // 公开接口，任何人都可以访问
  @Get()
  @Public()
  async list() {
    return [];
  }
}
```

### 2. 受保护接口（需要认证）

默认所有接口都需要认证，不需要额外装饰器：

```typescript
@Controller('users')
export class UserController {
  // 需要认证才能访问
  @Get()
  async list() {
    return [];
  }
}
```

### 3. 获取当前用户信息

使用 `@CurrentUser()` 装饰器：

```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  // 获取完整用户信息
  @Get()
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  // 只获取用户 ID
  @Get('posts')
  async getUserPosts(@CurrentUser('id') userId: number) {
    return this.postService.findByUserId(userId);
  }

  // 只获取用户邮箱
  @Get('email')
  async getUserEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
```

## API 示例

### 登录

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# 响应
{
  "data": {
    "token": "abc123...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "张三",
      "roles": ["user"]
    }
  },
  "statusCode": 200,
  "message": "操作成功"
}
```

### 使用 Token 访问受保护接口

```bash
GET /users
Authorization: Bearer abc123...

# 或直接使用 Token
GET /users
Authorization: abc123...
```

### 获取当前用户信息

```bash
GET /auth/me
Authorization: Bearer abc123...

# 响应
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "张三",
    "roles": ["user"]
  },
  "statusCode": 200,
  "message": "操作成功"
}
```

### 登出

```bash
POST /auth/logout
Authorization: Bearer abc123...
```

## AuthService API

### 创建会话

```typescript
const token = await this.authService.createSession(
  {
    id: 1,
    email: 'user@example.com',
    name: '张三',
    roles: ['user'],
  },
  7 * 24 * 3600, // 7 天
);
```

### 获取用户信息

```typescript
const userInfo = await this.authService.getUserInfo(token);
```

### 刷新会话

```typescript
const success = await this.authService.refreshSession(token);
```

### 销毁会话

```typescript
const success = await this.authService.destroySession(token);
```

### 验证 Token

```typescript
const isValid = await this.authService.validateToken(token);
```

## 完整示例

```typescript
import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from '../common/auth/auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 登录
   */
  @Post('login')
  @Public()
  async login(@Body() body: { email: string; password: string }) {
    // 1. 验证用户名密码（实际项目中应该查询数据库）
    // 2. 创建会话
    const token = await this.authService.createSession({
      id: 1,
      email: body.email,
      name: '用户名',
      roles: ['user'],
    });

    return { token };
  }

  /**
   * 登出
   */
  @Post('logout')
  async logout(@CurrentUser() user: any) {
    // 从请求中获取 token 并销毁
    return { message: '登出成功' };
  }

  /**
   * 获取当前用户
   */
  @Get('me')
  async me(@CurrentUser() user: any) {
    return user;
  }

  /**
   * 刷新 Token
   */
  @Post('refresh')
  async refresh(@CurrentUser() user: any) {
    // 重新生成 token
    const newToken = await this.authService.createSession(user);
    return { token: newToken };
  }
}
```

## 错误处理

### 未提供 Token

```json
{
  "statusCode": 401,
  "message": "未提供认证令牌",
  "timestamp": "2025-12-01T..."
}
```

### Token 无效或过期

```json
{
  "statusCode": 401,
  "message": "令牌无效或已过期",
  "timestamp": "2025-12-01T..."
}
```

## 注意事项

1. Token 存储在 Redis，重启 Redis 会导致所有用户登出
2. 默认 Token 有效期 7 天
3. 可以通过 `@Public()` 标记公开接口
4. 使用 `@CurrentUser()` 获取当前用户信息
5. 支持 `Bearer Token` 和直接 Token 两种格式
