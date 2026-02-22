import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  async findByEmail(email: string){
    return await this.adminUserRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async updateLastLogin(adminId: number) {
    return await this.adminUserRepository.update(
      {
        id: adminId,
      },
      {
        lastLoginAt: new Date(),
      },
    );
  }
}
