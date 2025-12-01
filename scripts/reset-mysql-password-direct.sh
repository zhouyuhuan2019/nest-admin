#!/bin/bash

# MySQL 密码重置脚本（直接安装版本）
# 使用方法: sudo bash scripts/reset-mysql-password-direct.sh

set -e

NEW_PASSWORD="gtxy"

echo "🔐 开始重置 MySQL root 密码..."
echo "新密码将设置为: $NEW_PASSWORD"
echo ""

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 sudo 运行此脚本"
    echo "   sudo bash scripts/reset-mysql-password-direct.sh"
    exit 1
fi

# 1. 停止 MySQL
echo "1️⃣ 停止 MySQL 服务..."
/usr/local/mysql/support-files/mysql.server stop 2>/dev/null || true
killall mysqld 2>/dev/null || true
sleep 3

# 2. 创建临时初始化文件
echo "2️⃣ 创建临时配置..."
INIT_FILE="/tmp/mysql-init-$(date +%s).txt"
cat > "$INIT_FILE" << EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
FLUSH PRIVILEGES;
EOF

# 3. 使用初始化文件启动 MySQL
echo "3️⃣ 使用新密码启动 MySQL..."
/usr/local/mysql/bin/mysqld --user=_mysql --init-file="$INIT_FILE" &
MYSQLD_PID=$!

# 4. 等待 MySQL 启动
echo "4️⃣ 等待 MySQL 启动..."
sleep 8

# 5. 停止临时 MySQL
echo "5️⃣ 停止临时 MySQL..."
kill $MYSQLD_PID 2>/dev/null || killall mysqld 2>/dev/null || true
sleep 3

# 6. 删除临时文件
rm -f "$INIT_FILE"

# 7. 正常启动 MySQL
echo "6️⃣ 正常启动 MySQL 服务..."
/usr/local/mysql/support-files/mysql.server start
sleep 3

# 8. 测试连接
echo "7️⃣ 测试新密码..."
if /usr/local/mysql/bin/mysql -u root -p"$NEW_PASSWORD" -e "SELECT 'Password reset successful!' as Status;" 2>/dev/null; then
    echo ""
    echo "✅ 密码重置成功！"
    echo ""
    echo "新密码: $NEW_PASSWORD"
    echo ""
else
    echo ""
    echo "⚠️  自动测试失败，但密码可能已重置"
    echo "请手动测试: mysql -u root -p"
    echo "密码: $NEW_PASSWORD"
    echo ""
fi

echo "现在执行以下步骤："
echo ""
echo "1. 创建数据库并修复认证插件："
echo "   mysql -u root -p"
echo "   密码: $NEW_PASSWORD"
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
