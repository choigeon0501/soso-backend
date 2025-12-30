import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthTransactionService } from './services/auth-transcation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthIdentity])],
  controllers: [AuthController],
  providers: [AuthService, AuthIdentityRepository, AuthTransactionService],
  exports: [AuthIdentityRepository],
})
export class AuthModule {}
