# 重置 MySQL Root 密码（macOS）

## 方法 1：使用 Homebrew（推荐）

### 1. 停止 MySQL 服务
```bash
brew services stop mysql
```

### 2. 以安全模式启动 MySQL（跳过权限验证）
```bash
mysqld_safe --skip-grant-tables &
```

### 3. 在新终端窗口中，无密码登录 MySQL
```bash
mysql -u root
```

### 4. 重置密码
在 MySQL 中执行：
```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 停止安全模式的 MySQL
```bash
# 查找 MySQL 进程
ps aux | grep mysql

# 停止进程（替换 PID）
kill -9 <PID>
```

### 6. 正常启动 MySQL
```bash
brew services start mysql
```

### 7. 测试新密码
```bash
mysql -u root -p
# 输入新密码：new_password
```

---

## 方法 2：使用 mysql_secure_installation

如果 MySQL 是新安装的，可能还没设置密码：

```bash
# 尝试无密码登录
mysql -u root

# 如果能登录，直接设置密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

---

## 方法 3：完全重置（如果以上方法都不行）

### 1. 完全停止 MySQL
```bash
brew services stop mysql
killall mysqld
```

### 2. 创建临时初始化文件
```bash
echo "ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';" > /tmp/mysql-init.txt
```

### 3. 使用初始化文件启动 MySQL
```bash
mysqld --init-file=/tmp/mysql-init.txt &
```

### 4. 等待几秒后，停止 MySQL
```bash
killall mysqld
```

### 5. 删除临时文件
```bash
rm /tmp/mysql-init.txt
```

### 6. 正常启动 MySQL
```bash
brew services start mysql
```

### 7. 测试新密码
```bash
mysql -u root -p
# 输入新密码：new_password
```

---

## 快速操作（推荐）

打开终端，依次执行：

```bash
# 1. 停止 MySQL
brew services stop mysql

# 2. 启动安全模式
mysqld_safe --skip-grant-tables &

# 3. 等待 3 秒
sleep 3

# 4. 在新终端执行（或者继续在当前终端）
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gtxy';
FLUSH PRIVILEGES;
EXIT;
EOF

# 5. 停止安全模式
killall mysqld

# 6. 正常启动
brew services start mysql

# 7. 测试登录
mysql -u root -p
# 密码：gtxy
```

---

## 设置完成后

1. 更新项目的 .env 文件：
```env
DATABASE_URL="mysql://root:gtxy@localhost:3306/gtxy"
```

2. 修改认证插件：
```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS gtxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'gtxy';
FLUSH PRIVILEGES;
EXIT;
```

3. 运行迁移：
```bash
npm run prisma:migrate
```

---

## 如果还是不行

可以尝试完全卸载并重新安装 MySQL：

```bash
# 卸载 MySQL
brew services stop mysql
brew uninstall mysql
rm -rf /usr/local/var/mysql
rm -rf /usr/local/etc/my.cnf

# 重新安装
brew install mysql

# 启动服务
brew services start mysql

# 首次登录（无密码）
mysql -u root

# 设置密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'gtxy';
FLUSH PRIVILEGES;
EXIT;
```
