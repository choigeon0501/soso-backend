import { Module } from '@nestjs/common';
import { UserTransactionsRepository } from './user.repository';
import { SubmitTransactionsRepository } from './submit.repository';
import { ReviewTransactionsRepository } from './review.repository';
import { AdminTransactionsRepository } from './admin.repository';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  providers: [UserTransactionsRepository, SubmitTransactionsRepository, ReviewTransactionsRepository, AdminTransactionsRepository],
  exports: [UserTransactionsRepository, SubmitTransactionsRepository, ReviewTransactionsRepository, AdminTransactionsRepository],
})
export class TransactionsModule {}
