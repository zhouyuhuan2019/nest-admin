import { UserVo } from './user.vo';

export class UserListVo {
  data: UserVo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
