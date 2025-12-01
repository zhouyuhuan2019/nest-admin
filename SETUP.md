# 项目设置指南

## 前置要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm 或 yarn

## 详细安装步骤

### 1. 克隆项目并安装依赖

```bash
npm install
```

### 2. 配置数据库

确保 MySQL 服务已启动，创建数据库：

```sql
CREATE DATABASE gtxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置 Redis

确保 Redis 服务已启动：

```bash
# macOS (使用 Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# 验证 Redis 是否运行
redis-cli ping
# 应该返回 PONG
```

### 4. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改数据库连接信息：

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/gtxy"
```

### 5. 初始化 Prisma

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建数据库表
npm run prisma:migrate
```

### 6. 启动项目

```bash
# 开发模式（热重载）
npm run start:dev
```

访问 http://localhost:3000 查看应用信息

## 常见问题

### 数据库连接失败

1. 检查 MySQL 服务是否启动
2. 验证 `.env` 中的数据库连接信息
3. 确保数据库已创建

### Redis 连接失败

1. 检查 Redis 服务是否启动
2. 验证 `.env` 中的 Redis 配置
3. 如果 Redis 有密码，确保配置了 `REDIS_PASSWORD`

### Prisma 迁移失败

```bash
# 重置数据库（警告：会删除所有数据）
npx prisma migrate reset

# 重新生成 Prisma Client
npm run prisma:generate

# 重新运行迁移
npm run prisma:migrate
```

## 开发工具

### Prisma Studio

可视化数据库管理工具：

```bash
npx prisma studio
```

访问 http://localhost:5555

### 查看数据库结构

```bash
npx prisma db pull
```

## 测试 API

使用 curl 测试：

```bash
# 健康检查
curl http://localhost:3000/health

# 创建用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# 获取用户列表
curl http://localhost:3000/users
```

或使用 Postman / Insomnia 等工具进行测试。
