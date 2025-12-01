#!/bin/bash

echo "🚀 开始设置项目..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要 Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js 版本检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置数据库连接信息"
fi

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npm run prisma:generate

echo ""
echo "✅ 项目设置完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件配置数据库连接"
echo "2. 确保 MySQL 和 Redis 服务已启动"
echo "3. 运行 'npm run prisma:migrate' 创建数据库表"
echo "4. 运行 'npm run start:dev' 启动开发服务器"
