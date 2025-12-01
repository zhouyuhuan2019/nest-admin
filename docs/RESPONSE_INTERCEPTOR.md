# 响应拦截器使用文档

## 概述

响应拦截器会自动将所有 API 响应包装成统一格式，但支持流式输出和特殊场景的原始数据返回。

## 统一响应格式

### 成功响应
```json
{
  "data": { ... },
  "statusCode": 200,
  "message": "操作成功",
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

### 错误响应
```json
{
  "statusCode": 400,
  "message": "错误信息",
  "timestamp": "2025-12-01T12:00:00.000Z",
  "path": "/api/users/1"
}
```

## 自动跳过包装的场景

拦截器会自动识别以下场景，不进行响应包装：

### 1. StreamableFile（文件流）
```typescript
@Get('download')
downloadFile(): StreamableFile {
  const file = createReadStream('file.pdf');
  return new StreamableFile(file);
}
```

### 2. SSE (Server-Sent Events)
```typescript
@Sse('events')
sendEvents(): Observable<MessageEvent> {
  return interval(1000).pipe(
    map((num) => ({ data: { count: num } }))
  );
}
```

### 3. 文件下载（Content-Disposition）
```typescript
@Get('export')
@Header('Content-Disposition', 'attachment; filename="data.csv"')
exportData() {
  return 'csv,data,here';
}
```

### 4. 流式响应（Content-Type: stream）
```typescript
@Get('stream')
@Header('Content-Type', 'application/octet-stream')
streamData() {
  return buffer;
}
```

## 手动跳过包装

使用 `@SkipTransform()` 装饰器：

```typescript
import { SkipTransform } from '../common/decorators/skip-transform.decorator';

@Get('raw')
@SkipTransform()
getRawData() {
  return {
    customFormat: true,
    data: '原始数据'
  };
}
```

## 使用示例

### 普通 API（自动包装）
```typescript
@Get(':id')
async getUser(@Param('id') id: number): Promise<UserVo> {
  return this.userService.findOne(id);
}

// 响应：
// {
//   "data": { "id": 1, "name": "张三" },
//   "statusCode": 200,
//   "message": "操作成功",
//   "timestamp": "2025-12-01T12:00:00.000Z"
// }
```

### SSE 实时推送
```typescript
@Sse('notifications')
notifications(): Observable<MessageEvent> {
  return this.notificationService.stream();
}

// 前端接收：
// const eventSource = new EventSource('/api/notifications');
// eventSource.onmessage = (event) => {
//   console.log(JSON.parse(event.data));
// };
```

### 文件下载
```typescript
@Get('export')
@Header('Content-Type', 'text/csv')
@Header('Content-Disposition', 'attachment; filename="users.csv"')
exportUsers() {
  return this.userService.exportToCsv();
}
```

### 自定义格式响应
```typescript
@Get('custom')
@SkipTransform()
customResponse() {
  return {
    code: 0,
    msg: 'success',
    result: { ... }
  };
}
```

## 测试接口

启动服务后可以测试以下接口：

1. **普通响应**: `GET /users/1`
2. **SSE 流**: `GET /users/stream/events`
3. **原始数据**: `GET /users/stream/raw/123`
4. **文件下载**: `GET /users/stream/download/test.txt`
5. **流式 JSON**: `GET /users/stream/stream-json`

## 注意事项

1. 拦截器按顺序执行，确保在 `main.ts` 中正确注册
2. 流式响应不会被缓存，适合大数据量传输
3. SSE 连接会保持打开状态，注意资源管理
4. 使用 `@SkipTransform()` 时需要自行处理错误格式
