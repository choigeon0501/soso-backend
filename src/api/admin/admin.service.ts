import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AuthTokenService } from '../auth/services/auth-token.service';
import { AdminLoginDto } from './dto/request/admin-login.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async adminLogin(body: AdminLoginDto): Promise<string> {
    const { email, password } = body;

    const admin = await this.adminUserRepository.findByEmail(email);
    if (!admin) {
      throw new ForbiddenException();
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new ForbiddenException();
    }

    await this.adminUserRepository.updateLastLoginAt(admin.id);

    return this.authTokenService.issueAdminToken(admin.id);
  }
}
