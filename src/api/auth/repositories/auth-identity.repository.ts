import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { AuthProvider } from '../../../common/enum/auth.enum';

@Injectable()
export class AuthIdentityRepository {
  constructor(
    @InjectRepository(AuthIdentity)
    private authIdentityRepository: Repository<AuthIdentity>,
  ) {}

  async findAuthIdentityByUuid(uuid: string) {
    return await this.authIdentityRepository.findOne({
      where: {
        user: {
          uuid,
        },
      },
    });
  }

  async findAuthIdentityByAuthProviderId(authProviderId: string, authProvider: AuthProvider) {
    return await this.authIdentityRepository.findOne({
      where: {
        provider: authProvider,
        providerUid: authProviderId,
      },
    });
  }

  async createAuthIdentity(authProviderId: string, authProvider: AuthProvider, userUuid: string) {
    return await this.authIdentityRepository.save({
      provider: authProvider,
      providerUid: authProviderId,
      user: { uuid: userUuid },
    });
  }
}
