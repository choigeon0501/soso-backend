import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthTransactionService } from './services/auth-transcation.service';
import { AuthTokenService } from './services/auth-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthIdentity])],
  controllers: [AuthController],
  providers: [AuthService, AuthIdentityRepository, AuthTransactionService, AuthTokenService],
  exports: [AuthIdentityRepository],
})
export class AuthModule {}
