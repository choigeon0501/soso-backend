import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';

@Injectable()
export class UserWithdrawalRepository {
  constructor(
    @InjectRepository(UserWithdrawal)
    private userWithdrawalRepository: Repository<UserWithdrawal>,
    private loggerService: LoggerService,
  ) {}

  async findWithdrawalUsers() {
    try {
      return await this.userWithdrawalRepository.find({});
    } catch (err) {
      this.loggerService.warn(`Withdrawal/ findWithdrawalUsers Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
