import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ShopService } from '../shop/shop.service';
import * as bcrypt from 'bcrypt';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AuthTokenService } from '../auth/services/auth-token.service';

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

  async getAllUsers() {
    return await this.userService.getAllUsersForAdmin();
  }

  async getAllShopReports() {
    return await this.shopService.getAllShopReportsForAdmin();
  }

  async getAllReviewReports() {
    return await this.shopService.getAllReviewReportsForAdmin();
  }

  async getAllSubmissions() {
    return await this.shopService.getAllSubmissions();
  }
}
