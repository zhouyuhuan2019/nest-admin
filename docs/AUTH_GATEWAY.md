# 网关式鉴权使用文档

## 概述

类似网关插件的鉴权机制：
1. **Token 解析中间件** - 自动解析所有请求的 Token，注入用户信息
2. **选择性鉴权** - 在 Controller 层使用装饰器决定是否需要鉴权

## 工作流程

```
请求 → Token 解析中间件 → 注入用户信息 → Controller → 鉴权守卫（如果需要）
```

## 使用方式

### 1. 不需要登录的接口（默认）

默认所有接口都不需要登录，但可以获取用户信息（如果有）：

```typescript
@Controller('posts')
export class PostController {
  // 不需要登录，任何人都可以访问
  // 但如果用户登录了，可以获取用户信息
  @Get()
  async list(@CurrentUser() user: any) {
    // user 可能为 undefined（未登录）
    // 或包含用户信息（已登录）
    if (user) {
      // 已登录用户的逻辑
      return this.postService.findForUser(user.id);
    } else {
      // 未登录用户的逻辑
      return this.postService.findPublic();
    }
  }
}
```

### 2. 需要登录的接口

使用 `@RequireAuth()` 装饰器：

```typescript
import { RequireAuth } from '../common/decorators/require-auth.decorator';

@Controller('profile')
export class ProfileController {
  // 必须登录才能访问
  @Get()
  @RequireAuth()
  async getProfile(@CurrentUser() user: any) {
    // user 一定存在，因为 @RequireAuth() 会检查
    return user;
  }

  @Put()
  @RequireAuth()
  async updateProfile(@Body() data: any, @CurrentUser() user: any) {
    return this.profileService.update(user.id, data);
  }
}
```

### 3. 需要特定角色的接口

使用 `@RequireRoles()` 装饰器：

```typescript
import { RequireAuth, RequireRoles } from '../common/decorators/require-auth.decorator';

@Controller('admin')
export class AdminController {
  // 需要管理员角色
  @Get('users')
  @RequireAuth()
  @RequireRoles('admin')
  async listUsers() {
    return this.userService.findAll();
  }

  // 需要多个角色之一
  @Delete('posts/:id')
  @RequireAuth()
  @RequireRoles('admin', 'moderator')
  async deletePost(@Param('id') id: number) {
    return this.postService.delete(id);
  }
}
```

### 4. 自定义权限检查

在 Controller 方法中进行自定义权限检查：

```typescript
@Controller('posts')
export class PostController {
  @Put(':id')
  @RequireAuth()
  async update(
    @Param('id') id: number,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    const post = await this.postService.findOne(id);

    // 只能修改自己的文章
    if (post.authorId !== user.id) {
      throw BusinessException.forbidden('只能修改自己的文章');
    }

    return this.postService.update(id, data);
  }

  @Delete(':id')
  @RequireAuth()
  async delete(@Param('id') id: number, @CurrentUser() user: any) {
    const post = await this.postService.findOne(id);

    // 作者或管理员可以删除
    if (post.authorId !== user.id && !user.roles?.includes('admin')) {
      throw BusinessException.forbidden('无权删除此文章');
    }

    return this.postService.delete(id);
  }
}
```

## Token 传递方式

Token 解析中间件支持多种方式传递 Token：

### 1. Authorization Header（推荐）

```bash
# Bearer Token
GET /api/users
Authorization: Bearer abc123...

# 直接 Token
GET /api/users
Authorization: abc123...
```

### 2. Cookie

```bash
GET /api/users
Cookie: token=abc123...
```

### 3. Query Parameter（不推荐，仅用于特殊场景）

```bash
GET /api/users?token=abc123...
```

## 完整示例

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAuth, RequireRoles } from '../common/decorators/require-auth.decorator';
import { BusinessException } from '../common/exceptions/business.exception';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * 获取文章列表 - 不需要登录
   * 但已登录用户可以看到更多信息
   */
  @Get()
  async list(@CurrentUser() user: any) {
    if (user) {
      // 已登录：返回包含私有文章的列表
      return this.postService.findAllForUser(user.id);
    } else {
      // 未登录：只返回公开文章
      return this.postService.findPublic();
    }
  }

  /**
   * 获取单个文章 - 不需要登录
   */
  @Get(':id')
  async get(@Param('id') id: number, @CurrentUser() user: any) {
    const post = await this.postService.findOne(id);

    // 私有文章需要登录且是作者
    if (post.isPrivate && (!user || post.authorId !== user.id)) {
      throw BusinessException.forbidden('无权查看此文章');
    }

    return post;
  }

  /**
   * 创建文章 - 需要登录
   */
  @Post()
  @RequireAuth()
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.postService.create({
      ...data,
      authorId: user.id,
    });
  }

  /**
   * 更新文章 - 需要登录且是作者
   */
  @Put(':id')
  @RequireAuth()
  async update(
    @Param('id') id: number,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    const post = await this.postService.findOne(id);

    if (post.authorId !== user.id) {
      throw BusinessException.forbidden('只能修改自己的文章');
    }

    return this.postService.update(id, data);
  }

  /**
   * 删除文章 - 需要管理员或作者
   */
  @Delete(':id')
  @RequireAuth()
  async delete(@Param('id') id: number, @CurrentUser() user: any) {
    const post = await this.postService.findOne(id);

    // 管理员或作者可以删除
    const isAdmin = user.roles?.includes('admin');
    const isAuthor = post.authorId === user.id;

    if (!isAdmin && !isAuthor) {
      throw BusinessException.forbidden('无权删除此文章');
    }

    return this.postService.delete(id);
  }

  /**
   * 发布文章 - 需要编辑或管理员角色
   */
  @Post(':id/publish')
  @RequireAuth()
  @RequireRoles('editor', 'admin')
  async publish(@Param('id') id: number) {
    return this.postService.publish(id);
  }
}
```

## 用户信息结构

通过 `@CurrentUser()` 获取的用户信息结构：

```typescript
{
  id: number;           // 用户 ID
  email: string;        // 邮箱
  name?: string;        // 姓名
  roles?: string[];     // 角色列表
}
```

## 错误处理

### 未登录

```json
{
  "statusCode": 401,
  "message": "请先登录",
  "timestamp": "2025-12-01T..."
}
```

### 权限不足

```json
{
  "statusCode": 403,
  "message": "权限不足",
  "timestamp": "2025-12-01T..."
}
```

### 自定义错误

```json
{
  "statusCode": 403,
  "message": "只能修改自己的文章",
  "timestamp": "2025-12-01T..."
}
```

## 优势

1. **灵活性** - 可以在 Controller 层自由决定是否需要鉴权
2. **渐进式** - 默认不需要鉴权，需要时添加装饰器即可
3. **细粒度** - 可以在方法内部进行复杂的权限判断
4. **用户友好** - 未登录用户也能访问部分功能
5. **类似网关** - Token 解析和鉴权分离，更符合微服务架构

## 最佳实践

1. **公开接口** - 默认不加装饰器
2. **需要登录** - 添加 `@RequireAuth()`
3. **需要角色** - 添加 `@RequireRoles('admin')`
4. **复杂权限** - 在方法内部判断并抛出异常
5. **获取用户** - 使用 `@CurrentUser()` 或 `@CurrentUser('id')`
