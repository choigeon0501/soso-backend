import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AdminJwtAuthGuard } from '../../common/admin-jwt/admin-jwt-auth.guard';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return await this.adminService.adminLogin(adminLoginDto);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('users')
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('shop-reports')
  async getAllShopReports() {
    return await this.adminService.getAllShopReports();
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('review-reports')
  async getAllReviewReports() {
    return await this.adminService.getAllReviewReports();
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('submission')
  async getAllSubmissions() {
    return await this.adminService.getAllSubmissions();
  }
}
