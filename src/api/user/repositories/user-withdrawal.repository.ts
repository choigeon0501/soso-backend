import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';

@Injectable()
export class UserWithdrawalRepository {
  constructor(
    @InjectRepository(UserWithdrawal)
    private readonly userWithdrawalRepository: Repository<UserWithdrawal>,
  ) {}

  async findAll(order: 'ASC' | 'DESC'): Promise<UserWithdrawal[]> {
    return this.userWithdrawalRepository.find({ order: { createdAt: order } });
  }
}
