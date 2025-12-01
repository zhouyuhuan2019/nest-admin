# 项目启动检查清单

在启动项目之前，请确保完成以下步骤：

## 📋 前置条件检查

### 1. 环境要求
- [ ] Node.js >= 18.0.0 已安装
  ```bash
  node -v
  ```
- [ ] npm 已安装
  ```bash
  npm -v
  ```
- [ ] MySQL >= 8.0 已安装并运行
  ```bash
  mysql --version
  # 测试连接
  mysql -u root -p
  ```
- [ ] Redis >= 6.0 已安装并运行
  ```bash
  redis-cli --version
  # 测试连接
  redis-cli ping  # 应返回 PONG
  ```

## 🔧 项目配置

### 2. 安装依赖
- [ ] 运行 `npm install`
- [ ] 确认没有错误或警告

### 3. 环境变量配置
- [ ] 复制 `.env.example` 为 `.env`
  ```bash
  cp .env.example .env
  ```
- [ ] 编辑 `.env` 文件
  - [ ] 设置正确的 `DATABASE_URL`
  - [ ] 设置正确的 `REDIS_HOST` 和 `REDIS_PORT`
  - [ ] 如果 Redis 有密码，设置 `REDIS_PASSWORD`
  - [ ] 确认 `PORT` 端口未被占用

### 4. 数据库准备
- [ ] 创建 MySQL 数据库
  ```sql
  CREATE DATABASE gtxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- [ ] 生成 Prisma Client
  ```bash
  npm run prisma:generate
  ```
- [ ] 运行数据库迁移
  ```bash
  npm run prisma:migrate
  ```
- [ ] 确认迁移成功，没有错误

## 🚀 启动项目

### 5. 构建验证
- [ ] 运行构建命令
  ```bash
  npm run build
  ```
- [ ] 确认构建成功，dist 目录已生成

### 6. 启动开发服务器
- [ ] 启动开发模式
  ```bash
  npm run start:dev
  ```
- [ ] 看到以下输出：
  ```
  🚀 Server running on http://localhost:3000
  📦 Environment: development
  ```

## ✅ 功能验证

### 7. API 测试

#### 健康检查
- [ ] 访问 http://localhost:3000/health
- [ ] 返回状态码 200
- [ ] 响应包含 `status: "ok"`

#### 应用信息
- [ ] 访问 http://localhost:3000
- [ ] 返回应用名称和版本信息

#### 用户 API
- [ ] 创建用户
  ```bash
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test User"}'
  ```
- [ ] 获取用户列表
  ```bash
  curl http://localhost:3000/users
  ```
- [ ] 获取用户详情（替换 {id} 为实际 ID）
  ```bash
  curl http://localhost:3000/users/{id}
  ```
- [ ] 更新用户
  ```bash
  curl -X PUT http://localhost:3000/users/{id} \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Name"}'
  ```
- [ ] 删除用户
  ```bash
  curl -X DELETE http://localhost:3000/users/{id}
  ```

### 8. 数据验证测试
- [ ] 测试无效邮箱（应返回 400 错误）
  ```bash
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid-email","name":"Test"}'
  ```
- [ ] 测试缺少必填字段（应返回 400 错误）
  ```bash
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -d '{"name":"Test"}'
  ```

### 9. 分页功能测试
- [ ] 测试分页查询
  ```bash
  curl http://localhost:3000/users?page=1&limit=5
  ```
- [ ] 确认响应包含 `meta` 字段（total, page, limit, totalPages）

## 🔍 可选工具

### 10. Prisma Studio（可选）
- [ ] 启动 Prisma Studio
  ```bash
  npx prisma studio
  ```
- [ ] 访问 http://localhost:5555
- [ ] 可视化查看数据库数据

### 11. API 测试工具（可选）
- [ ] 使用 VS Code REST Client 插件
- [ ] 打开 `api-test.http` 文件
- [ ] 点击 "Send Request" 测试各个 API

## 🐛 常见问题排查

### 如果遇到问题：

#### 端口被占用
- [ ] 修改 `.env` 中的 `PORT`
- [ ] 或者停止占用端口的进程

#### 数据库连接失败
- [ ] 检查 MySQL 服务是否运行
- [ ] 验证 `.env` 中的 `DATABASE_URL`
- [ ] 确认数据库已创建
- [ ] 检查用户名和密码是否正确

#### Redis 连接失败
- [ ] 检查 Redis 服务是否运行
- [ ] 验证 `.env` 中的 Redis 配置
- [ ] 如果有密码，确认 `REDIS_PASSWORD` 已设置

#### Prisma 迁移失败
- [ ] 重置数据库
  ```bash
  npx prisma migrate reset
  ```
- [ ] 重新运行迁移
  ```bash
  npm run prisma:migrate
  ```

#### 构建错误
- [ ] 删除 node_modules 和 dist
  ```bash
  rm -rf node_modules dist
  ```
- [ ] 重新安装依赖
  ```bash
  npm install
  ```
- [ ] 重新构建
  ```bash
  npm run build
  ```

## 📚 完成后

- [ ] 阅读 [README.md](README.md) 了解项目功能
- [ ] 阅读 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) 了解架构
- [ ] 查看 [COMPLETED.md](COMPLETED.md) 了解已实现的功能

## ✨ 全部完成！

如果所有检查项都已完成，恭喜你！项目已经可以正常运行了。

开始开发你的功能吧！🎉
