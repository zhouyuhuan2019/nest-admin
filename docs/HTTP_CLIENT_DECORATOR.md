# HTTP 客户端装饰器使用指南

## 概述

基于装饰器的 HTTP 客户端，类似于 Java 的 Feign 或 TypeScript 的 Retrofit，让 API 调用更加优雅和类型安全。

## 快速开始

### 1. 定义客户端类

```typescript
import { HttpClient, Get, Post, Path, Query, Body } from '../common/http/decorators/http-client.decorator';

@HttpClient({
  serviceName: 'github',
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
  },
  retries: 2,
})
export class GitHubClient {
  @Get('/users/:username')
  async getUser(@Path('username') username: string): Promise<any> {
    return {};
  }

  @Get('/users/:username/repos')
  async getUserRepos(
    @Path('username') username: string,
    @Query('sort') sort?: string,
    @Query('per_page') perPage?: number,
  ): Promise<any[]> {
    return [];
  }
}
```

### 2. 在 Service 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { HttpClientFactory } from '../common/http/http-client.factory';
import { GitHubClient } from './clients/github.client';

@Injectable()
export class MyService {
  private githubClient: GitHubClient;

  constructor(private readonly httpClientFactory: HttpClientFactory) {
    this.githubClient = this.httpClientFactory.create(GitHubClient);
  }

  async getUserInfo(username: string) {
    return await this.githubClient.getUser(username);
  }

  async getUserRepos(username: string) {
    return await this.githubClient.getUserRepos(username, 'updated', 10);
  }
}
```

## 装饰器说明

### @HttpClient - 类装饰器

定义 HTTP 客户端的基础配置。

```typescript
@HttpClient({
  serviceName: 'my-service',  // 服务名称（必填）
  baseURL: 'https://api.example.com',  // 基础 URL（必填）
  timeout: 30000,  // 超时时间（毫秒）
  headers: {  // 默认请求头
    'Content-Type': 'application/json',
  },
  retries: 2,  // 重试次数
})
export class MyClient {}
```

### HTTP 方法装饰器

#### @Get - GET 请求

```typescript
@Get('/users')
async getUsers(): Promise<User[]> {
  return [];
}

@Get('/users/:id')
async getUser(@Path('id') id: number): Promise<User> {
  return {};
}
```

#### @Post - POST 请求

```typescript
@Post('/users')
async createUser(@Body() data: CreateUserDto): Promise<User> {
  return {};
}
```

#### @Put - PUT 请求

```typescript
@Put('/users/:id')
async updateUser(@Path('id') id: number, @Body() data: UpdateUserDto): Promise<User> {
  return {};
}
```

#### @Delete - DELETE 请求

```typescript
@Delete('/users/:id')
async deleteUser(@Path('id') id: number): Promise<void> {
  return;
}
```

#### @Patch - PATCH 请求

```typescript
@Patch('/users/:id')
async patchUser(@Path('id') id: number, @Body() data: Partial<UpdateUserDto>): Promise<User> {
  return {};
}
```

### 参数装饰器

#### @Path - 路径参数

```typescript
// URL: /users/:id 或 /users/{id}
@Get('/users/:id')
async getUser(@Path('id') id: number): Promise<User> {
  return {};
}

// 多个路径参数
@Get('/users/:userId/posts/:postId')
async getUserPost(
  @Path('userId') userId: number,
  @Path('postId') postId: number,
): Promise<Post> {
  return {};
}
```

#### @Query - 查询参数

```typescript
// 单个查询参数
@Get('/users')
async getUsers(@Query('page') page: number): Promise<User[]> {
  return [];
}

// 多个查询参数
@Get('/users')
async searchUsers(
  @Query('keyword') keyword: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
): Promise<User[]> {
  return [];
}

// 查询参数对象
@Get('/users')
async getUsersWithParams(@Query() params: { page?: number; limit?: number }): Promise<User[]> {
  return [];
}
```

#### @Body - 请求体

```typescript
@Post('/users')
async createUser(@Body() data: CreateUserDto): Promise<User> {
  return {};
}

// 结合路径参数
@Put('/users/:id')
async updateUser(@Path('id') id: number, @Body() data: UpdateUserDto): Promise<User> {
  return {};
}
```

#### @Header - 请求头

```typescript
@Get('/users')
async getUsers(@Header('Authorization') token: string): Promise<User[]> {
  return [];
}

// 多个请求头
@Post('/users')
async createUser(
  @Body() data: CreateUserDto,
  @Header('Authorization') token: string,
  @Header('X-Request-ID') requestId: string,
): Promise<User> {
  return {};
}
```

#### @Headers - 请求头对象

```typescript
@Get('/users')
async getUsers(@Headers() headers: Record<string, string>): Promise<User[]> {
  return [];
}
```

### @Stream - 流式响应

用于处理流式数据（如 SSE、文件下载等）。

```typescript
import { Readable } from 'stream';

@Get('/stream')
@Stream()
async getStream(): Promise<Readable> {
  return {} as Readable;
}

@Post('/chat')
@Stream()
async chatStream(@Body() data: any): Promise<Readable> {
  return {} as Readable;
}
```

## 完整示例

### 示例 1：JSONPlaceholder API

```typescript
@HttpClient({
  serviceName: 'jsonplaceholder',
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  retries: 2,
})
export class JsonPlaceholderClient {
  @Get('/posts')
  async getPosts(@Query() params?: { userId?: number }): Promise<Post[]> {
    return [];
  }

  @Get('/posts/:id')
  async getPost(@Path('id') id: number): Promise<Post> {
    return {};
  }

  @Post('/posts')
  async createPost(@Body() data: CreatePostDto): Promise<Post> {
    return {};
  }

  @Put('/posts/:id')
  async updatePost(@Path('id') id: number, @Body() data: UpdatePostDto): Promise<Post> {
    return {};
  }

  @Delete('/posts/:id')
  async deletePost(@Path('id') id: number): Promise<void> {
    return;
  }
}
```

### 示例 2：OpenAI API（支持流式）

```typescript
@HttpClient({
  serviceName: 'openai',
  baseURL: 'https://api.openai.com/v1',
  timeout: 60000,
  retries: 1,
})
export class OpenAIClient {
  // 普通请求
  @Post('/chat/completions')
  async chatCompletion(
    @Body() request: ChatCompletionRequest,
    @Header('Authorization') apiKey: string,
  ): Promise<ChatCompletionResponse> {
    return {};
  }

  // 流式请求
  @Post('/chat/completions')
  @Stream()
  async chatCompletionStream(
    @Body() request: ChatCompletionRequest,
    @Header('Authorization') apiKey: string,
  ): Promise<Readable> {
    return {} as Readable;
  }
}
```

### 示例 3：GitHub API

```typescript
@HttpClient({
  serviceName: 'github',
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
  },
})
export class GitHubClient {
  @Get('/users/:username')
  async getUser(@Path('username') username: string): Promise<GitHubUser> {
    return {};
  }

  @Get('/users/:username/repos')
  async getUserRepos(
    @Path('username') username: string,
    @Query('sort') sort?: 'created' | 'updated' | 'pushed' | 'full_name',
    @Query('per_page') perPage?: number,
  ): Promise<GitHubRepo[]> {
    return [];
  }

  @Get('/search/repositories')
  async searchRepos(
    @Query('q') query: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<SearchResult> {
    return {};
  }
}
```

## 在 Service 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { HttpClientFactory } from '../common/http/http-client.factory';
import { JsonPlaceholderClient } from './clients/jsonplaceholder.client';
import { OpenAIClient } from './clients/openai.client';

@Injectable()
export class ExternalApiService {
  private jsonPlaceholderClient: JsonPlaceholderClient;
  private openAIClient: OpenAIClient;

  constructor(private readonly httpClientFactory: HttpClientFactory) {
    // 创建客户端实例
    this.jsonPlaceholderClient = this.httpClientFactory.create(JsonPlaceholderClient);
    this.openAIClient = this.httpClientFactory.create(OpenAIClient);
  }

  // 使用 JSONPlaceholder
  async getExternalPosts(userId?: number) {
    return await this.jsonPlaceholderClient.getPosts({ userId });
  }

  async getExternalPost(id: number) {
    return await this.jsonPlaceholderClient.getPost(id);
  }

  // 使用 OpenAI
  async chatWithAI(message: string, apiKey: string) {
    return await this.openAIClient.chatCompletion(
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      },
      `Bearer ${apiKey}`,
    );
  }

  // 流式调用
  async chatWithAIStream(message: string, apiKey: string) {
    const stream = await this.openAIClient.chatCompletionStream(
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        stream: true,
      },
      `Bearer ${apiKey}`,
    );

    // 处理流式数据
    stream.on('data', (chunk) => {
      console.log(chunk.toString());
    });

    return stream;
  }
}
```

## 高级特性

### 1. 自动重试

```typescript
@HttpClient({
  serviceName: 'my-service',
  baseURL: 'https://api.example.com',
  retries: 3,  // 失败后重试 3 次
})
export class MyClient {}
```

### 2. 超时控制

```typescript
@HttpClient({
  serviceName: 'my-service',
  baseURL: 'https://api.example.com',
  timeout: 5000,  // 5 秒超时
})
export class MyClient {}
```

### 3. 默认请求头

```typescript
@HttpClient({
  serviceName: 'my-service',
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'My-App/1.0',
  },
})
export class MyClient {}
```

### 4. 动态请求头

```typescript
@Post('/users')
async createUser(
  @Body() data: CreateUserDto,
  @Header('Authorization') token: string,  // 动态传入
): Promise<User> {
  return {};
}
```

## 最佳实践

1. **统一管理客户端**
```
src/
├── clients/
│   ├── github.client.ts
│   ├── openai.client.ts
│   └── jsonplaceholder.client.ts
└── services/
    └── external-api.service.ts
```

2. **类型定义**
```typescript
// 定义清晰的类型
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
}
```

3. **错误处理**
```typescript
async getUser(id: number) {
  try {
    return await this.myClient.getUser(id);
  } catch (error) {
    this.logger.error(`获取用户失败: ${error.message}`);
    throw new BusinessException('获取用户信息失败');
  }
}
```

4. **环境配置**
```typescript
// 使用环境变量
@HttpClient({
  serviceName: 'my-service',
  baseURL: process.env.MY_SERVICE_URL || 'https://api.example.com',
})
export class MyClient {}
```

## 注意事项

1. 方法体的返回值只是类型声明，实际返回值由装饰器处理
2. 所有方法必须是 `async` 的
3. 流式请求返回 `Readable` 类型
4. 路径参数支持 `:param` 和 `{param}` 两种格式
5. 查询参数值为 `undefined` 或 `null` 时会被忽略
