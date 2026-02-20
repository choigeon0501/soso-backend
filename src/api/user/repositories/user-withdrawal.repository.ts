import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';

@Injectable()
export class UserWithdrawalRepository {
  constructor(
    @InjectRepository(UserWithdrawal)
    private userWithdrawalRepository: Repository<UserWithdrawal>,
  ) {}

  async findWithdrawalUsers(order: 'ASC' | 'DESC' = 'DESC') {
    return await this.userWithdrawalRepository.find({
      order: { createdAt: order },
    });
  }
}
