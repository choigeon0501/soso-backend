import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminUserRepository.findOne({ where: { email } });
  }

  async updateLastLoginAt(adminId: number): Promise<void> {
    await this.adminUserRepository.update({ id: adminId }, { lastLoginAt: new Date() });
  }
}
