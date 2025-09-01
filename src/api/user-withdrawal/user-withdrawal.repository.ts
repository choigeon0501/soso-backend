import { Injectable, InternalServerErrorException, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWithdrawal } from '../../database/entity/user-withdrawal.entity';

@Injectable()
export class UserWithdrawalRepository {
  constructor(
    @InjectRepository(UserWithdrawal)
    private userWithdrawalRepository: Repository<UserWithdrawal>,
    private loggerService: LoggerService,
  ) {}

  // reason_code 이넘화 필요
  async createUserWithdrawal(uuid: string, reason_code: string, reason_text: string) {
    try {
      return await this.userWithdrawalRepository.save({
        user: { uuid },
        reason_code,
        reason_text,
      });
    } catch (err) {
      this.loggerService.warn(`UserWithdrawal/ createUserWithdrawal Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
