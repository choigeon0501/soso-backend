import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/database/entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { AwsModule } from '../aws/aws.module';
import { ReviewModule } from '../review/review.module';
import { SubmitModule } from '../submit/submit.module';
import { RecentSearchModule } from '../recent-search/recent-search.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ShopModule } from '../shop/shop.module';
import { UserFavoriteModule } from '../user-favorite/user-favorite.module';

@Module({
  imports: [
    forwardRef(() => SubmitModule),
    TypeOrmModule.forFeature([User]),
    ShopModule,
    AwsModule,
    ReviewModule,
    UserFavoriteModule,
    RecentSearchModule,
    TransactionsModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
