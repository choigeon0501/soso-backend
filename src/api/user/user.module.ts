import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/api/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repositories/user.repository';
import { AwsModule } from '../../common/aws/aws.module';
import { ReviewModule } from '../review/review.module';
import { ShopModule } from '../shop/shop.module';
import { UserFavoriteRepository } from './repositories/user-favorite.repository';
import { UserFavorite } from './entities/user-favorite.entity';
import { UserTransactionsRepository } from './repositories/user-transactions.repository';

@Module({
  imports: [forwardRef(() => ShopModule), TypeOrmModule.forFeature([User, UserFavorite]), AwsModule, ReviewModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserFavoriteRepository, UserTransactionsRepository],
  exports: [UserService, UserRepository, UserFavoriteRepository, UserTransactionsRepository],
})
export class UserModule {}
