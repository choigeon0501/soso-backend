import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { AuthProvider } from '../const/auth-provider.const';

@Injectable()
export class AuthIdentityRepository {
  constructor(
    @InjectRepository(AuthIdentity)
    private readonly authIdentityRepository: Repository<AuthIdentity>,
  ) {}

  async findByUuid(uuid: string): Promise<AuthIdentity | null> {
    return this.authIdentityRepository.findOne({ where: { user: { uuid } } });
  }

  async findByProviderUidWithUser(providerUid: string, provider: AuthProvider): Promise<AuthIdentity | null> {
    return this.authIdentityRepository.findOne({
      where: { provider, providerUid },
      relations: ['user'],
    });
  }
}
