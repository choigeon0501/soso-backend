import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { AdminUser } from '../../api/admin/entities/admin-user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule,
    JwtModule.register({}), // sign은 서비스에서
  ],
  providers: [AdminJwtStrategy, AdminJwtAuthGuard],
  exports: [AdminJwtAuthGuard],
})
export class AdminJwtModule {}
