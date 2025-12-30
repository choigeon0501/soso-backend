import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  @Get('shop-reports')
  async getAllShopReports() {
    return await this.adminService.getAllShopReports();
  }

  @Get('review-reports')
  async getAllReviewReports() {
    return await this.adminService.getAllReviewReports();
  }
}
