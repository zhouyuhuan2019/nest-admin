# Redis 使用文档

## 概述

Redis 模块是可选的，如果 Redis 不可用，应用会自动降级运行，不影响核心功能。

## 配置

### 环境变量（.env）

```env
# 是否启用 Redis（默认 true）
REDIS_ENABLED=true

# Redis 连接配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 禁用 Redis

如果不想使用 Redis，有两种方式：

1. **设置环境变量**
```env
REDIS_ENABLED=false
```

2. **不配置 REDIS_HOST**
```env
# 注释掉或删除 REDIS_HOST
# REDIS_HOST=127.0.0.1
```

## 启动 Redis

### macOS (Homebrew)
```bash
# 安装
brew install redis

# 启动服务
brew services start redis

# 停止服务
brew services stop redis

# 手动启动
redis-server
```

### Docker
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

## RedisService API

### 基础操作

```typescript
import { RedisService } from '../redis/redis.service';

constructor(private readonly redis: RedisService) {}

// 检查 Redis 是否可用
if (this.redis.isAvailable()) {
  // Redis 可用
}

// 设置缓存（带过期时间）
await this.redis.set('key', { data: 'value' }, 3600); // 1小时

// 获取缓存
const data = await this.redis.get<MyType>('key');

// 删除缓存
await this.redis.del('key');

// 批量删除
await this.redis.del(['key1', 'key2']);

// 检查键是否存在
const exists = await this.redis.exists('key');

// 设置过期时间
await this.redis.expire('key', 3600);
```

### 模式匹配删除

```typescript
// 删除所有匹配的键
const count = await this.redis.delPattern('user:*');
console.log(`删除了 ${count} 个键`);
```

### 计数器操作

```typescript
// 增加计数
const count = await this.redis.incr('visit:count');

// 减少计数
const count = await this.redis.decr('visit:count');
```

### Hash 操作

```typescript
// 设置 Hash 字段
await this.redis.hset('user:1', 'name', 'John');
await this.redis.hset('user:1', 'age', 25);

// 获取 Hash 字段
const name = await this.redis.hget('user:1', 'name');

// 获取所有字段
const user = await this.redis.hgetall('user:1');
// { name: 'John', age: 25 }
```

### 获取 Redis 信息

```typescript
const info = await this.redis.info();
console.log(info);
```

## 使用示例

### 1. 缓存查询结果

```typescript
@Injectable()
export class UserService {
  constructor(private readonly redis: RedisService) {}

  async findOne(id: number) {
    // 尝试从缓存获取
    const cached = await this.redis.get<User>(`user:${id}`);
    if (cached) {
      return cached;
    }

    // 从数据库查询
    const user = await this.db.findUser(id);

    // 写入缓存（1小时）
    await this.redis.set(`user:${id}`, user, 3600);

    return user;
  }
}
```

### 2. 限流器

```typescript
async checkRateLimit(userId: number): Promise<boolean> {
  const key = `rate:${userId}`;
  const count = await this.redis.incr(key);

  if (count === 1) {
    // 第一次请求，设置过期时间
    await this.redis.expire(key, 60); // 1分钟
  }

  return count <= 100; // 每分钟最多100次
}
```

### 3. 分布式锁

```typescript
async acquireLock(resource: string, ttl: number = 10): Promise<boolean> {
  const key = `lock:${resource}`;
  const result = await this.redis.set(key, '1', ttl);
  return result;
}

async releaseLock(resource: string): Promise<void> {
  const key = `lock:${resource}`;
  await this.redis.del(key);
}
```

### 4. 会话存储

```typescript
async saveSession(sessionId: string, data: any): Promise<void> {
  const key = `session:${sessionId}`;
  await this.redis.set(key, data, 86400); // 24小时
}

async getSession(sessionId: string): Promise<any> {
  const key = `session:${sessionId}`;
  return await this.redis.get(key);
}
```

## 降级策略

当 Redis 不可用时，所有操作会优雅降级：

- `set()` 返回 `false`
- `get()` 返回 `null`
- `del()` 返回 `false`
- `isAvailable()` 返回 `false`

应用会继续正常运行，只是失去缓存功能。

## 测试接口

```bash
# 健康检查（包含 Redis 状态）
GET http://localhost:3000/health

# Redis 功能测试
GET http://localhost:3000/redis/test
```

## 最佳实践

1. **总是检查可用性**
```typescript
if (this.redis.isAvailable()) {
  // 使用缓存
} else {
  // 直接查询数据库
}
```

2. **设置合理的过期时间**
```typescript
// 热数据：1小时
await this.redis.set('hot:data', data, 3600);

// 冷数据：24小时
await this.redis.set('cold:data', data, 86400);

// 临时数据：5分钟
await this.redis.set('temp:data', data, 300);
```

3. **使用命名空间**
```typescript
// 好的做法
const key = `user:${userId}`;
const key = `session:${sessionId}`;
const key = `cache:list:${page}`;

// 避免
const key = userId.toString();
```

4. **批量操作**
```typescript
// 批量删除
await this.redis.delPattern('user:*');

// 批量删除指定键
await this.redis.del(['key1', 'key2', 'key3']);
```

## 监控

查看 Redis 状态：

```bash
# 连接 Redis CLI
redis-cli

# 查看所有键
KEYS *

# 查看键数量
DBSIZE

# 查看内存使用
INFO memory

# 监控实时命令
MONITOR
```
