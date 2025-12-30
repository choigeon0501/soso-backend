import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ShopService } from '../shop/shop.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly shopService: ShopService,
  ) {}

  async getAllUsers() {
    return await this.userService.getAllUsersForAdmin();
  }

  async getAllShopReports() {
    return await this.shopService.getAllShopReportsForAdmin();
  }

  async getAllReviewReports() {
    return await this.shopService.getAllReviewReportsForAdmin();
  }
}
