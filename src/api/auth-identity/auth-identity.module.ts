import { Module } from '@nestjs/common';
import { AuthIdentityRepository } from './auth-identity.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthIdentity } from '../../database/entity/auth-identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthIdentity])],
  providers: [AuthIdentityRepository],
  exports: [AuthIdentityRepository],
})
export class AuthIdentityModule {}
