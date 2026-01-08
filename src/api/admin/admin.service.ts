import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ShopService } from '../shop/shop.service';
import * as bcrypt from 'bcrypt';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AuthTokenService } from '../auth/services/auth-token.service';
import { GetAllUsersResponseDto } from './dto/response/get-all-users-response.dto';
import { GetAllShopReportResponseDto } from './dto/response/get-all-shop-report-response.dto';
import { GetAllReviewReportResponseDto } from './dto/response/get-all-review-report-response.dto';
import { GetAllSubmissionsForAdminResponseDto } from './dto/response/get-all-submission-response.dto';
import { ToggleShopHiddenDto } from './dto/request/toggle-shop-hidden.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly shopService: ShopService,
    private readonly authTokenService: AuthTokenService,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { email, password } = adminLoginDto;

    const admin = await this.adminUserRepository.findByEmail(email);
    if (!admin) {
      throw new ForbiddenException();
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new ForbiddenException();
    }

    await this.adminUserRepository.updateLastLogin(admin.id);

    return this.authTokenService.issueAdminToken(admin.id);
  }

  async getAllUsers(): Promise<GetAllUsersResponseDto> {
    return await this.userService.getAllUsersForAdmin();
  }

  async getAllShopReports(): Promise<GetAllShopReportResponseDto[]> {
    return await this.shopService.getAllShopReportsForAdmin();
  }

  async getAllReviewReports(): Promise<GetAllReviewReportResponseDto[]> {
    return await this.shopService.getAllReviewReportsForAdmin();
  }

  async getAllSubmissions(): Promise<GetAllSubmissionsForAdminResponseDto> {
    return await this.shopService.getAllSubmissions();
  }

  async toggleShopHidden(shopId: number, toggleShopHiddenDto: ToggleShopHiddenDto): Promise<void> {
    const { isHidden } = toggleShopHiddenDto;

    return await this.shopService.toggleShopHidden(shopId, isHidden);
  }
}
