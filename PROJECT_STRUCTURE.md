# 项目架构说明

## 目录结构

```
advich-nest-admin/
├── src/
│   ├── common/                    # 公共模块
│   │   ├── dto/                  # 数据传输对象
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── pagination.dto.ts
│   │   ├── filters/              # 异常过滤器
│   │   │   └── http-exception.filter.ts
│   │   └── interceptors/         # 拦截器
│   │       └── transform.interceptor.ts
│   ├── config/                   # 配置模块
│   │   └── configuration.ts
│   ├── prisma/                   # Prisma ORM 模块
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── redis/                    # Redis 模块
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── user/                     # 用户模块
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── app.controller.ts         # 应用根控制器
│   ├── app.module.ts             # 应用根模块
│   └── main.ts                   # 应用入口
├── prisma/
│   └── schema.prisma             # Prisma 数据库模型
├── scripts/
│   └── setup.sh                  # 快速设置脚本
├── .env                          # 环境变量（不提交）
├── .env.example                  # 环境变量示例
├── .eslintrc.js                  # ESLint 配置
├── .prettierrc                   # Prettier 配置
├── nest-cli.json                 # NestJS CLI 配置
├── tsconfig.json                 # TypeScript 配置
├── tsconfig.build.json           # 构建配置
├── package.json                  # 项目依赖
├── README.md                     # 项目说明
├── SETUP.md                      # 详细设置指南
└── PROJECT_STRUCTURE.md          # 本文件
```

## 核心模块说明

### 1. Common 模块（公共模块）

包含项目中可复用的组件：

- **DTO (Data Transfer Objects)**: 数据验证和传输
  - `CreateUserDto`: 创建用户的数据结构
  - `UpdateUserDto`: 更新用户的数据结构
  - `PaginationDto`: 分页查询参数

- **Filters (过滤器)**: 全局异常处理
  - `HttpExceptionFilter`: 统一处理 HTTP 异常，返回标准错误格式

- **Interceptors (拦截器)**: 请求/响应处理
  - `TransformInterceptor`: 统一响应格式，包装返回数据

### 2. Config 模块（配置模块）

- 使用 `@nestjs/config` 管理环境变量
- 提供类型安全的配置访问
- 支持多环境配置

### 3. Prisma 模块（数据库 ORM）

- 封装 Prisma Client
- 提供数据库连接管理
- 生命周期钩子（连接/断开）
- 全局模块，可在任何地方注入使用

### 4. Redis 模块（缓存）

- 封装 ioredis 客户端
- 提供 Redis 连接管理
- 支持配置化连接参数
- 全局模块，可用于缓存、会话等

### 5. User 模块（用户管理）

完整的 CRUD 示例：
- Controller: 处理 HTTP 请求
- Service: 业务逻辑层
- 支持分页查询
- 数据验证
- 错误处理

## 设计模式

### 1. 模块化设计

每个功能模块独立，职责清晰：
- Controller 层：处理 HTTP 请求
- Service 层：业务逻辑
- Module 层：依赖注入配置

### 2. 依赖注入

使用 NestJS 的 DI 容器：
- 松耦合
- 易于测试
- 可维护性高

### 3. 全局配置

- 全局异常过滤器
- 全局数据验证管道
- 全局响应拦截器
- 全局 CORS 配置

### 4. 统一响应格式

所有成功响应：
```json
{
  "data": {},
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

所有错误响应：
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "message": "Error message"
}
```

## 扩展指南

### 添加新模块

1. 使用 NestJS CLI 生成模块：
```bash
nest g module feature-name
nest g controller feature-name
nest g service feature-name
```

2. 在 `app.module.ts` 中导入新模块

3. 创建相应的 DTO 和实体

### 添加新的数据模型

1. 编辑 `prisma/schema.prisma`
2. 运行迁移：
```bash
npm run prisma:migrate
```

### 添加中间件

在 `src/common/middleware/` 创建中间件，然后在模块中注册。

### 添加守卫（Guards）

在 `src/common/guards/` 创建守卫，用于认证和授权。

## 最佳实践

1. **使用 DTO 进行数据验证**
   - 所有输入数据都应该有对应的 DTO
   - 使用 class-validator 装饰器

2. **错误处理**
   - 使用 NestJS 内置的 HttpException
   - 自定义异常类继承 HttpException

3. **异步操作**
   - 所有数据库操作使用 async/await
   - 正确处理 Promise 错误

4. **代码组织**
   - 按功能模块组织代码
   - 保持文件小而专注
   - 遵循单一职责原则

5. **类型安全**
   - 充分利用 TypeScript 类型系统
   - 避免使用 any 类型
   - 为配置和环境变量定义类型

## 性能优化建议

1. **数据库查询优化**
   - 使用 Prisma 的 select 和 include
   - 避免 N+1 查询问题
   - 合理使用索引

2. **缓存策略**
   - 使用 Redis 缓存热点数据
   - 设置合理的过期时间
   - 缓存失效策略

3. **分页查询**
   - 所有列表接口都应支持分页
   - 限制单次查询的最大数量

## 安全建议

1. **输入验证**
   - 使用 ValidationPipe
   - 启用 whitelist 和 forbidNonWhitelisted

2. **环境变量**
   - 敏感信息存储在 .env
   - 不要提交 .env 到版本控制

3. **CORS 配置**
   - 生产环境配置具体的允许域名
   - 不要使用 `*` 通配符

4. **错误信息**
   - 生产环境不要暴露详细错误信息
   - 记录详细日志用于调试
