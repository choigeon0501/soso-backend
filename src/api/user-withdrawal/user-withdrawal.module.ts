import { Module } from '@nestjs/common';
import { UserWithdrawalRepository } from './user-withdrawal.repository';

@Module({
  providers: [UserWithdrawalRepository],
  exports: [UserWithdrawalRepository],
})
export class UserWithdrawalModule {}
