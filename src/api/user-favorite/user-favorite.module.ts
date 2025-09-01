import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFavorite } from '../../database/entity/user-favorite.entity';
import { UserFavoriteRepository } from './user-favorite.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavorite])],
  providers: [UserFavoriteRepository],
  exports: [UserFavoriteRepository],
})
export class UserFavoriteModule {}
