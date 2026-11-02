import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserFavoriteService } from './services/user-favorite.service';
import { UserTransactionService } from './services/user-transaction.service';
import { UserRepository } from './repositories/user.repository';
import { UserFavoriteRepository } from './repositories/user-favorite.repository';
import { UserWithdrawalRepository } from './repositories/user-withdrawal.repository';
import { User } from './entities/user.entity';
import { UserFavorite } from './entities/user-favorite.entity';
import { UserWithdrawal } from './entities/user-withdrawal.entity';
import { AuthModule } from '../auth/auth.module';
import { ShopModule } from '../shop/shop.module';
import { ReviewModule } from '../review/review.module';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserFavorite, UserWithdrawal]), forwardRef(() => ShopModule), ReviewModule, AuthModule, AwsModule],
  exports: [UserService, UserFavoriteService],
  controllers: [UserController],
  providers: [UserService, UserFavoriteService, UserTransactionService, UserRepository, UserFavoriteRepository, UserWithdrawalRepository],
})
export class UserModule {}
