# 快速启动指南

## 一键设置（推荐）

```bash
# 运行设置脚本
bash scripts/setup.sh
```

## 手动设置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改数据库连接信息
# DATABASE_URL="mysql://root:your_password@localhost:3306/gtxy"
```

### 3. 启动必要服务

确保以下服务正在运行：

**MySQL:**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

**Redis:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移（创建表）
npm run prisma:migrate
```

### 5. 启动项目

```bash
# 开发模式（推荐）
npm run start:dev

# 生产模式
npm run build
npm run start
```

## 验证安装

### 1. 检查服务状态

访问 http://localhost:3000/health

预期响应：
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试用户 API

**创建用户：**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

**获取用户列表：**
```bash
curl http://localhost:3000/users
```

## 常见问题

### 端口被占用

修改 `.env` 文件中的 `PORT` 值：
```env
PORT=3001
```

### 数据库连接失败

1. 检查 MySQL 是否运行：
```bash
mysql -u root -p
```

2. 创建数据库：
```sql
CREATE DATABASE gtxy;
```

3. 验证 `.env` 中的连接字符串

### Redis 连接失败

1. 检查 Redis 是否运行：
```bash
redis-cli ping
# 应返回 PONG
```

2. 如果 Redis 有密码，在 `.env` 中配置：
```env
REDIS_PASSWORD=your_password
```

### Prisma 迁移失败

重置并重新迁移：
```bash
npx prisma migrate reset
npm run prisma:migrate
```

## 开发工具

### Prisma Studio（数据库可视化）

```bash
npx prisma studio
```

访问 http://localhost:5555

### 代码格式化

```bash
npm run format
```

## 下一步

- 查看 [README.md](README.md) 了解项目功能
- 查看 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) 了解架构设计
- 查看 [SETUP.md](SETUP.md) 了解详细配置

## 技术支持

如遇到问题，请检查：
1. Node.js 版本 >= 18.0.0
2. MySQL 和 Redis 服务状态
3. `.env` 配置是否正确
4. 数据库是否已创建
