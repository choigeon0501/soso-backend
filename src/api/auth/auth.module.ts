import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthTransactionService } from './services/auth-transaction.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthIdentity } from './entities/auth-identity.entity';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuthIdentity])],
  exports: [AuthService, AuthTokenService],
  controllers: [AuthController],
  providers: [AuthService, AuthTransactionService, AuthTokenService, AuthIdentityRepository],
})
export class AuthModule {}
