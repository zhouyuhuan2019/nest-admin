import { Global, Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { HttpClientFactory } from './http-client.factory';

@Global()
@Module({
  providers: [HttpClientService, HttpClientFactory],
  exports: [HttpClientService, HttpClientFactory],
})
export class HttpClientModule {}
