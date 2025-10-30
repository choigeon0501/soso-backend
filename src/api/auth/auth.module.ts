import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entity/user.entity';
import { UserModule } from '../user/user.module';
import { AuthIdentity } from '../../database/entity/auth-identity.entity';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';

@Module({
  imports: [forwardRef(() => UserModule), TypeOrmModule.forFeature([User, AuthIdentity])],
  controllers: [AuthController],
  providers: [AuthService, AuthIdentityRepository],
})
export class AuthModule {}
