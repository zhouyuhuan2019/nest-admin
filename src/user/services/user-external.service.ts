import { Injectable } from '@nestjs/common';
import { HttpClientFactory } from '../../common/http/http-client.factory';
import { LoggerService } from '../../common/logger/logger.service';
import { ExampleApiClient } from '../clients/example-api.client';

/**
 * 用户外部 API 服务
 * 演示如何在业务服务中使用 HTTP 客户端
 */
@Injectable()
export class UserExternalService {
  private readonly logger: LoggerService;
  private exampleApiClient: ExampleApiClient;

  constructor(
    private readonly httpClientFactory: HttpClientFactory,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService;
    this.logger.setContext('UserExternalService');
    // 创建 API 客户端实例
    this.exampleApiClient = this.httpClientFactory.create(ExampleApiClient);
  }

  /**
   * 获取外部用户列表
   */
  async getExternalUsers() {
    try {
      const users = await this.exampleApiClient.getUsers();
      this.logger.log(`获取到 ${users.length} 个外部用户`);
      return users;
    } catch (error) {
      this.logger.error(`获取外部用户失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取单个外部用户
   */
  async getExternalUser(id: number) {
    try {
      const user = await this.exampleApiClient.getUser(id);
      this.logger.log(`获取外部用户: ${user.name}`);
      return user;
    } catch (error) {
      this.logger.error(`获取外部用户 ${id} 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 搜索外部用户
   */
  async searchExternalUsers(name?: string, email?: string) {
    try {
      const users = await this.exampleApiClient.searchUsers(name, email);
      this.logger.log(`搜索到 ${users.length} 个外部用户`);
      return users;
    } catch (error) {
      this.logger.error(`搜索外部用户失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建外部用户
   */
  async createExternalUser(data: { name: string; email: string; phone?: string }) {
    try {
      const user = await this.exampleApiClient.createUser(data);
      this.logger.log(`创建外部用户成功: ${user.name}`);
      return user;
    } catch (error) {
      this.logger.error(`创建外部用户失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新外部用户
   */
  async updateExternalUser(id: number, data: { name?: string; email?: string; phone?: string }) {
    try {
      const user = await this.exampleApiClient.updateUser(id, data);
      this.logger.log(`更新外部用户成功: ${user.name}`);
      return user;
    } catch (error) {
      this.logger.error(`更新外部用户 ${id} 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除外部用户
   */
  async deleteExternalUser(id: number) {
    try {
      await this.exampleApiClient.deleteUser(id);
      this.logger.log(`删除外部用户 ${id} 成功`);
    } catch (error) {
      this.logger.error(`删除外部用户 ${id} 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 带认证的请求示例
   */
  async getExternalUserWithAuth(id: number, token: string) {
    try {
      const user = await this.exampleApiClient.getUserWithAuth(id, token);
      this.logger.log(`获取外部用户（带认证）: ${user.name}`);
      return user;
    } catch (error) {
      this.logger.error(`获取外部用户（带认证）失败: ${error.message}`);
      throw error;
    }
  }
}
