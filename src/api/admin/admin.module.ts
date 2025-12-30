import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [UserModule, ShopModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
