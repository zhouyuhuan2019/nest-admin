#!/bin/bash

# MySQL 密码重置脚本（macOS）
# 使用方法: bash scripts/reset-mysql-password.sh

set -e

NEW_PASSWORD="gtxy"

echo "🔐 开始重置 MySQL root 密码..."
echo "新密码将设置为: $NEW_PASSWORD"
echo ""

# 1. 停止 MySQL
echo "1️⃣ 停止 MySQL 服务..."
brew services stop mysql 2>/dev/null || true
sleep 2

# 2. 杀死所有 MySQL 进程
echo "2️⃣ 停止所有 MySQL 进程..."
killall mysqld 2>/dev/null || true
sleep 2

# 3. 创建临时初始化文件
echo "3️⃣ 创建临时配置..."
INIT_FILE="/tmp/mysql-init-$(date +%s).txt"
cat > "$INIT_FILE" << EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
FLUSH PRIVILEGES;
EOF

# 4. 使用初始化文件启动 MySQL
echo "4️⃣ 使用新密码启动 MySQL..."
mysqld --init-file="$INIT_FILE" &
MYSQLD_PID=$!

# 5. 等待 MySQL 启动
echo "5️⃣ 等待 MySQL 启动..."
sleep 5

# 6. 停止临时 MySQL
echo "6️⃣ 停止临时 MySQL..."
kill $MYSQLD_PID 2>/dev/null || killall mysqld 2>/dev/null || true
sleep 2

# 7. 删除临时文件
rm -f "$INIT_FILE"

# 8. 正常启动 MySQL
echo "7️⃣ 正常启动 MySQL 服务..."
brew services start mysql
sleep 3

# 9. 测试连接
echo "8️⃣ 测试新密码..."
if mysql -u root -p"$NEW_PASSWORD" -e "SELECT 'Password reset successful!' as Status;" 2>/dev/null; then
    echo ""
    echo "✅ 密码重置成功！"
    echo ""
    echo "新密码: $NEW_PASSWORD"
    echo ""
    echo "现在执行以下步骤："
    echo ""
    echo "1. 创建数据库并修复认证插件："
    echo "   mysql -u root -p$NEW_PASSWORD"
    echo ""
    echo "   然后在 MySQL 中执行："
    echo "   CREATE DATABASE IF NOT EXISTS gtxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$NEW_PASSWORD';"
    echo "   FLUSH PRIVILEGES;"
    echo "   EXIT;"
    echo ""
    echo "2. 确认 .env 文件配置："
    echo "   DATABASE_URL=\"mysql://root:$NEW_PASSWORD@localhost:3306/gtxy\""
    echo ""
    echo "3. 运行迁移："
    echo "   npm run prisma:migrate"
    echo ""
else
    echo ""
    echo "⚠️  自动测试失败，但密码可能已重置"
    echo "请手动测试: mysql -u root -p"
    echo "密码: $NEW_PASSWORD"
    echo ""
fi
