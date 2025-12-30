import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthProvider } from '../../../common/enum/auth.enum';
import { User } from '../../user/entities/user.entity';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { LoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class AuthTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  async createUserWithAuthIdentity(
    userUuid: string,
    email: string,
    providerUid: string,
    provider: AuthProvider,
    profileImgKey: string | null = null,
  ): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(User).save({
          uuid: userUuid,
          email,
          provider,
          profileImgKey,
        });

        await manager.getRepository(AuthIdentity).save({
          provider,
          providerUid,
          user: { uuid: userUuid },
        });
      });
    } catch (err) {
      this.loggerService.warn(`Auth signup transaction failed: ${err}`);
      throw new InternalServerErrorException('Auth signup transaction failed');
    }
  }
}
