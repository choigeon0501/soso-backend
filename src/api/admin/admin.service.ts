import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}

  async getAllUsers() {
    const activityUsers = await this.userService.getActiveUsersForAdmin();
    const withdrawalUsers = await this.userService.getWithdrawalUsersForAdmin();
    return { activityUsers, withdrawalUsers };
  }
}
