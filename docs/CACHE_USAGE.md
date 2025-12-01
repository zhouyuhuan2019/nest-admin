# 缓存使用指南

## 概述

直接使用 `RedisService` 提供的通用缓存方法，无需为每个模块创建单独的缓存服务。

## 快速开始

### 1. 注入 RedisService

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class YourService {
  constructor(private readonly redis: RedisService) {}
}
```

### 2. 使用缓存

```typescript
// 自动缓存查询结果（推荐）
async findOne(id: number) {
  return await this.redis.getOrSet(
    'user',              // 模块名
    `detail:${id}`,      // 缓存键
    async () => {        // 数据获取函数
      return await this.db.findUser(id);
    },
    3600                 // 过期时间（秒）
  );
}
```

## API 方法

### getOrSet - 自动缓存（推荐）

自动处理缓存逻辑：先查缓存，未命中则执行函数并缓存结果。

```typescript
async getOrSet<T>(
  module: string,           // 模块名
  key: string,              // 缓存键
  fetcher: () => Promise<T>, // 数据获取函数
  ttl: number = 3600        // 过期时间（秒）
): Promise<T>
```

**示例：**

```typescript
// 用户详情
const user = await this.redis.getOrSet(
  'user',
  `detail:${userId}`,
  async () => await this.prisma.user.findUnique({ where: { id: userId } }),
  3600
);

// 文章列表
const posts = await this.redis.getOrSet(
  'post',
  `list:page:${page}`,
  async () => await this.prisma.post.findMany({ skip, take }),
  300
);
```

### setCache - 设置缓存

```typescript
await this.redis.setCache('user', `detail:${id}`, userData, 3600);
```

### getCache - 获取缓存

```typescript
const user = await this.redis.getCache<User>('user', `detail:${id}`);
if (user) {
  // 缓存命中
}
```

### delCache - 删除缓存

```typescript
// 删除单个缓存
await this.redis.delCache('user', `detail:${id}`);
```

### delModuleCache - 删除模块缓存

```typescript
// 删除所有用户缓存
await this.redis.delModuleCache('user');

// 删除匹配的缓存
await this.redis.delModuleCache('user', 'detail:*');
```

## 使用场景

### 1. 查询缓存

```typescript
async findOne(id: number) {
  return await this.redis.getOrSet(
    'user',
    `detail:${id}`,
    async () => {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException();
      return user;
    },
    3600
  );
}
```

### 2. 更新时清除缓存

```typescript
async update(id: number, data: UpdateDto) {
  const updated = await this.prisma.user.update({ where: { id }, data });
  
  // 清除缓存
  await this.redis.delCache('user', `detail:${id}`);
  
  return updated;
}
```

### 3. 删除时清除缓存

```typescript
async remove(id: number) {
  const deleted = await this.prisma.user.delete({ where: { id } });
  
  // 清除缓存
  await this.redis.delCache('user', `detail:${id}`);
  
  return deleted;
}
```

### 4. 列表缓存

```typescript
async findAll(page: number, limit: number) {
  return await this.redis.getOrSet(
    'user',
    `list:page:${page}:limit:${limit}`,
    async () => {
      const users = await this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      return users;
    },
    300 // 列表缓存时间短一些
  );
}
```

### 5. 批量清除缓存

```typescript
async clearUserCache(userId: number) {
  // 清除用户相关的所有缓存
  await this.redis.delModuleCache('user', `detail:${userId}`);
  await this.redis.delModuleCache('user', `posts:${userId}:*`);
  await this.redis.delModuleCache('user', `comments:${userId}:*`);
}
```

## 缓存键命名规范

### 格式

```
{module}:{prefix}:{key}
```

### 示例

```typescript
// 用户详情
user:detail:123

// 用户列表
user:list:page:1:limit:10

// 用户文章
user:posts:123:page:1

// 文章详情
post:detail:456

// 文章评论
post:comments:456:page:1
```

### 推荐命名

```typescript
// 详情
`detail:${id}`

// 列表
`list:page:${page}:limit:${limit}`

// 关联数据
`${relation}:${id}:page:${page}`

// 统计数据
`stats:${type}:${date}`

// 配置数据
`config:${key}`
```

## 缓存时间建议

```typescript
// 热数据（频繁访问）
const HOT_DATA_TTL = 3600;        // 1小时

// 温数据（一般访问）
const WARM_DATA_TTL = 1800;       // 30分钟

// 冷数据（较少访问）
const COLD_DATA_TTL = 300;        // 5分钟

// 列表数据
const LIST_DATA_TTL = 300;        // 5分钟

// 统计数据
const STATS_DATA_TTL = 60;        // 1分钟

// 配置数据
const CONFIG_DATA_TTL = 86400;    // 24小时
```

## 完整示例

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 查询文章（带缓存）
  async findOne(id: number) {
    return await this.redis.getOrSet(
      'post',
      `detail:${id}`,
      async () => {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post) throw new NotFoundException();
        return post;
      },
      3600
    );
  }

  // 查询文章列表（带缓存）
  async findAll(page: number, limit: number) {
    return await this.redis.getOrSet(
      'post',
      `list:page:${page}:limit:${limit}`,
      async () => {
        return await this.prisma.post.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
      },
      300
    );
  }

  // 创建文章（清除列表缓存）
  async create(data: CreatePostDto) {
    const post = await this.prisma.post.create({ data });
    
    // 清除列表缓存
    await this.redis.delModuleCache('post', 'list:*');
    
    return post;
  }

  // 更新文章（清除缓存）
  async update(id: number, data: UpdatePostDto) {
    const post = await this.prisma.post.update({ where: { id }, data });
    
    // 清除详情和列表缓存
    await this.redis.delCache('post', `detail:${id}`);
    await this.redis.delModuleCache('post', 'list:*');
    
    return post;
  }

  // 删除文章（清除缓存）
  async remove(id: number) {
    const post = await this.prisma.post.delete({ where: { id } });
    
    // 清除所有相关缓存
    await this.redis.delCache('post', `detail:${id}`);
    await this.redis.delModuleCache('post', 'list:*');
    await this.redis.delModuleCache('post', `comments:${id}:*`);
    
    return post;
  }
}
```

## 注意事项

1. **Redis 不可用时自动降级**
   - 所有缓存操作失败不会影响业务逻辑
   - 会直接执行数据获取函数

2. **合理设置过期时间**
   - 热数据：1小时
   - 列表数据：5分钟
   - 统计数据：1分钟

3. **及时清除缓存**
   - 更新数据后清除对应缓存
   - 删除数据后清除相关缓存

4. **使用统一的命名规范**
   - 便于管理和批量删除
   - 避免键冲突

5. **避免缓存穿透**
   - 使用 `getOrSet` 自动处理
   - 对不存在的数据也可以缓存空值
