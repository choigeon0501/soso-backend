import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { User } from '../../database/entity/user.entity';
import { Wishlist } from '../../database/entity/user-favorite.entity';
import { SubmitUserRecord } from '../../database/entity/submit-user-record.entity';
import { RecentSearch } from '../../database/entity/recent-search.entity';
import { LoggerService } from '../logger/logger.service';
import { Image } from '../../database/entity/image.entity';

@Injectable()
export class DeleteUserTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private loggerService: LoggerService,
  ) {}

  async deleteUser(user: User, deleteType: number): Promise<void> {
    const { uuid, photoUrl } = user;
    const newUUID = uuidv4();

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const imgRepo = queryRunner.manager.getRepository(Image);
      const wishlistRepo = queryRunner.manager.getRepository(Wishlist);
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const recentSearchRepo = queryRunner.manager.getRepository(RecentSearch);

      await imgRepo.delete({ url: photoUrl });
      await wishlistRepo.delete({ user: { uuid } });
      await submitRepo.delete({ user: { uuid } });
      await recentSearchRepo.delete({ uuid });
      await userRepo
        .createQueryBuilder()
        .update(User)
        .set({
          uuid: newUUID,
          deleteType,
          photoUrl: null,
          nickName: null,
          email: null,
        })
        .where('uuid = :uuid', { uuid })
        .execute();
      await userRepo.softDelete({ uuid: newUUID });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`User/ deleteUser Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
