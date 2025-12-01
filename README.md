# Advich NestJS Admin Panel

基于 NestJS + Prisma + Redis 的后台管理系统

## 技术栈

- **NestJS** - 渐进式 Node.js 框架
- **Prisma** - 现代化 ORM
- **Redis** - 缓存和会话管理
- **TypeScript** - 类型安全
- **MySQL** - 数据库

## 功能特性

- ✅ 用户管理 CRUD
- ✅ 全局异常过滤器
- ✅ 统一响应拦截器
- ✅ 数据验证管道
- ✅ 分页查询
- ✅ 健康检查
- ✅ CORS 支持

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并修改配置：

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:password@localhost:3306/dbname"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate
```

### 4. 启动项目

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start
```

## API 接口

### 基础接口

- `GET /` - 应用信息
- `GET /health` - 健康检查

### 用户管理

- `POST /users` - 创建用户
- `GET /users` - 获取用户列表（支持分页）
- `GET /users/:id` - 获取用户详情
- `PUT /users/:id` - 更新用户
- `DELETE /users/:id` - 删除用户

### 请求示例

```bash
# 创建用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# 获取用户列表（分页）
curl http://localhost:3000/users?page=1&limit=10

# 获取用户详情
curl http://localhost:3000/users/{id}

# 更新用户
curl -X PUT http://localhost:3000/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# 删除用户
curl -X DELETE http://localhost:3000/users/{id}
```

## 项目结构

```
src/
├── common/              # 公共模块
│   ├── dto/            # 数据传输对象
│   ├── filters/        # 异常过滤器
│   └── interceptors/   # 拦截器
├── config/             # 配置文件
├── prisma/             # Prisma 模块
├── redis/              # Redis 模块
├── user/               # 用户模块
├── app.module.ts       # 根模块
├── app.controller.ts   # 根控制器
└── main.ts             # 入口文件
```

## 开发命令

```bash
# 开发
npm run start:dev

# 构建
npm run build

# 格式化代码
npm run format

# Prisma 相关
npm run prisma:generate  # 生成 Prisma Client
npm run prisma:migrate   # 运行迁移
```

## License

MIT
