import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { ShopModule } from '../shop/shop.module';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AuthModule } from '../auth/auth.module';
import { AdminJwtModule } from '../../common/admin-jwt/admin-jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { ReviewModule } from '../review/review.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser]), UserModule, ShopModule, AuthModule, AdminJwtModule, ReviewModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminService, AdminUserRepository],
})
export class AdminModule {}
