import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AdminUser } from './entities/admin-user.entity';
import { UserModule } from '../user/user.module';
import { ShopModule } from '../shop/shop.module';
import { ReviewModule } from '../review/review.module';
import { AuthModule } from '../auth/auth.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { AdminJwtModule } from '../../common/admin-jwt/admin-jwt.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser]), UserModule, ShopModule, ReviewModule, AuthModule, FeedbackModule, AdminJwtModule],
  controllers: [AdminController],
  providers: [AdminService, AdminUserRepository],
})
export class AdminModule {}
