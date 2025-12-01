# 生产环境部署指南

## 概述

本文档介绍如何将 NestJS 应用部署到生产服务器。

## 部署方式

### 方式 1：Docker 部署（推荐）

#### 1. 创建 Dockerfile

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:password@mysql:3306/mydb
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=mydb
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:alpine
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. 部署命令

```bash
# 构建并启动
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### 方式 2：PM2 部署

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 创建 ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'nest-admin',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

#### 3. 部署步骤

```bash
# 1. 构建应用
npm run build

# 2. 运行数据库迁移
npx prisma migrate deploy

# 3. 启动应用
pm2 start ecosystem.config.js

# 4. 保存 PM2 配置
pm2 save

# 5. 设置开机自启
pm2 startup

# 常用命令
pm2 list              # 查看进程列表
pm2 logs nest-admin   # 查看日志
pm2 restart nest-admin # 重启应用
pm2 stop nest-admin   # 停止应用
pm2 delete nest-admin # 删除应用
```

### 方式 3：Systemd 服务

#### 1. 创建服务文件

```bash
sudo nano /etc/systemd/system/nest-admin.service
```

```ini
[Unit]
Description=NestJS Admin Application
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nest-admin
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. 启动服务

```bash
# 重载配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start nest-admin

# 设置开机自启
sudo systemctl enable nest-admin

# 查看状态
sudo systemctl status nest-admin

# 查看日志
sudo journalctl -u nest-admin -f
```

## 服务器配置

### 1. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL
sudo apt install -y mysql-server

# 安装 Redis
sudo apt install -y redis-server

# 安装 Nginx（可选）
sudo apt install -y nginx
```

### 2. 配置 MySQL

```bash
# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -u root -p

CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON mydb.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 配置 Redis

```bash
# 编辑配置
sudo nano /etc/redis/redis.conf

# 设置密码（可选）
requirepass your_redis_password

# 重启 Redis
sudo systemctl restart redis
```

### 4. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/nest-admin
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/nest-admin /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 配置 SSL（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 部署流程

### 1. 准备代码

```bash
# 克隆代码
git clone https://github.com/your-repo/nest-admin.git
cd nest-admin

# 安装依赖
npm ci --only=production

# 生成 Prisma Client
npx prisma generate
```

### 2. 配置环境变量

```bash
# 创建生产环境配置
cp .env.example .env.production

# 编辑配置
nano .env.production
```

```env
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_URL="mysql://appuser:password@localhost:3306/mydb"

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### 3. 构建应用

```bash
# 构建
npm run build

# 运行数据库迁移
npx prisma migrate deploy
```

### 4. 启动应用

选择上述任一部署方式启动应用。

## 监控和维护

### 1. 日志管理

```bash
# PM2 日志
pm2 logs nest-admin

# Systemd 日志
sudo journalctl -u nest-admin -f

# Docker 日志
docker-compose logs -f app
```

### 2. 性能监控

```bash
# PM2 监控
pm2 monit

# 安装监控工具
npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

### 3. 数据库备份

```bash
# 创建备份脚本
nano /home/user/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
DB_NAME="mydb"
DB_USER="appuser"
DB_PASS="password"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# 设置定时任务
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /home/user/backup.sh
```

## 更新部署

### 使用 PM2

```bash
# 拉取最新代码
git pull

# 安装依赖
npm ci --only=production

# 构建
npm run build

# 运行迁移
npx prisma migrate deploy

# 重启应用
pm2 restart nest-admin
```

### 使用 Docker

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 运行迁移
docker-compose exec app npx prisma migrate deploy
```

## 故障排查

### 1. 应用无法启动

```bash
# 检查日志
pm2 logs nest-admin --lines 100

# 检查端口占用
sudo lsof -i :3000

# 检查环境变量
pm2 env 0
```

### 2. 数据库连接失败

```bash
# 测试数据库连接
mysql -u appuser -p -h localhost mydb

# 检查 MySQL 状态
sudo systemctl status mysql

# 查看 MySQL 日志
sudo tail -f /var/log/mysql/error.log
```

### 3. Redis 连接失败

```bash
# 测试 Redis 连接
redis-cli ping

# 检查 Redis 状态
sudo systemctl status redis

# 查看 Redis 日志
sudo tail -f /var/log/redis/redis-server.log
```

## 安全建议

1. **使用强密码** - 数据库、Redis 等服务使用强密码
2. **配置防火墙** - 只开放必要端口（80, 443）
3. **定期更新** - 及时更新系统和依赖包
4. **使用 HTTPS** - 配置 SSL 证书
5. **限制访问** - 使用 IP 白名单或 VPN
6. **备份数据** - 定期备份数据库和重要文件
7. **监控日志** - 定期检查应用和系统日志

## 性能优化

1. **启用集群模式** - 使用 PM2 cluster 模式
2. **配置缓存** - 使用 Redis 缓存热数据
3. **数据库优化** - 添加索引、优化查询
4. **启用 Gzip** - Nginx 启用压缩
5. **CDN 加速** - 静态资源使用 CDN
6. **连接池** - 配置合理的数据库连接池

## 常见问题

**Q: 如何查看应用运行状态？**
```bash
pm2 status
# 或
sudo systemctl status nest-admin
```

**Q: 如何重启应用？**
```bash
pm2 restart nest-admin
# 或
sudo systemctl restart nest-admin
```

**Q: 如何查看实时日志？**
```bash
pm2 logs nest-admin --lines 100
# 或
sudo journalctl -u nest-admin -f
```

**Q: 如何回滚到上一个版本？**
```bash
git checkout <previous-commit>
npm ci --only=production
npm run build
pm2 restart nest-admin
```
