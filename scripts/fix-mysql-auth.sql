-- MySQL 认证插件修复脚本
-- 使用方法: mysql -u root -p < scripts/fix-mysql-auth.sql

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS gtxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改 root 用户认证插件
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'gtxy';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';
