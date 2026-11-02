import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthProvider } from '../const/auth-provider.const';
import { User } from '../../user/entities/user.entity';
import { AuthIdentity } from '../entities/auth-identity.entity';

@Injectable()
export class AuthTransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async createUserWithAuthIdentity(uuid: string, email: string, providerUid: string, provider: AuthProvider): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(User).save({ uuid, email });
        await manager.getRepository(AuthIdentity).save({ provider, providerUid, user: { uuid } });
      });
    } catch (err) {
      throw new InternalServerErrorException('Auth signup transaction failed');
    }
  }
}
