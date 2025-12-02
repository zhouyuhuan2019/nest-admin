import { Controller, Get, Param, Sse, StreamableFile, Header } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { Public } from '../common/decorators/public.decorator';
import { SkipTransform } from '../common/decorators/skip-transform.decorator';
import { createReadStream } from 'fs';
import { join } from 'path';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

/**
 * 流式响应示例 Controller
 */
@Controller('users/stream')
export class UserStreamController {
  /**
   * 示例 1: SSE (Server-Sent Events) 流式推送
   * 用于实时推送数据到前端
   */
  @Sse('events')
  sendEvents(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map((num) => ({
        data: { message: `实时消息 ${num}`, timestamp: new Date().toISOString() },
      })),
    );
  }

  /**
   * 示例 2: 使用 @SkipTransform 装饰器跳过响应包装
   * 返回原始数据
   */
  @Public()
  @Get('raw/:id')
  @SkipTransform()
  getRawData(@Param('id') id: string) {
    return {
      userId: id,
      customFormat: true,
      data: '这是原始数据，不会被包装',
    };
  }

  /**
   * 示例 3: 文件流下载
   * 使用 StreamableFile 返回文件流
   */
  @Get('download/:filename')
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment; filename="example.txt"')
  downloadFile(@Param('filename') filename: string): StreamableFile {
    // 实际项目中应该从真实路径读取文件
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }

  /**
   * 示例 4: 流式 JSON 响应
   * 用于大数据量分批返回
   */
  @Get('stream-json')
  @Header('Content-Type', 'application/x-ndjson') // Newline Delimited JSON
  @SkipTransform()
  async streamJson() {
    // 模拟流式返回数据
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push(JSON.stringify({ id: i, name: `User ${i}` }) + '\n');
    }
    return data.join('');
  }
}
