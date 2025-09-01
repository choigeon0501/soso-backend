import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { Injectable } from '@nestjs/common';
import { UserFavorite } from '../../database/entity/user-favorite.entity';

@Injectable()
export class UserFavoriteRepository {
  constructor(
    @InjectRepository(UserFavorite)
    private favoriteRepository: Repository<UserFavorite>,
    private loggerService: LoggerService,
  ) {}

  async findUserFavoriteByShopIdAndUUID(shopId: number, uuid: string) {
    try {
      return await this.favoriteRepository.findOne({
        where: {
          user: { uuid },
          shop: { id: shopId },
        },
        relations: ['user', 'shop'],
      });
    } catch (err) {
      this.loggerService.warn(`Wishlist/ findWishlistByShopIdAndUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async deleteUserFavoriteByUserFavoritesId(userFavoriteId: number) {
    try {
      return await this.favoriteRepository.delete({
        id: userFavoriteId,
      });
    } catch (err) {
      this.loggerService.warn(`Wishlist/ deleteWishlistByWishlistId Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async addUserFavoriteByShopIdAndUUID(shopId: number, uuid: string) {
    try {
      return await this.favoriteRepository.save({
        user: { uuid }, // User 엔티티와 연결
        shop: { id: shopId }, // Shop 엔티티와 연결
      });
    } catch (err) {
      this.loggerService.warn(`Wishlist/ addWishlistByShopIdAndUUID Error: ${err}`);
      if (err.code == 'ER_DUP_ENTRY') {
        throw new ConflictException('이미 존재하는 데이터입니다');
      }
      throw new InternalServerErrorException();
    }
  }

  async findUserWishlistByUUID(uuid: string, areaId?: number) {
    try {
      const query = this.favoriteRepository
        .createQueryBuilder('wishlist')
        .leftJoinAndSelect('userFavorite.shop', 'shop')
        .leftJoinAndSelect('shop.region', 'region')
        .where('user-favorite.userUuid = :uuid', { uuid });

      if (areaId) {
        query.andWhere('region.id = :areaId', { areaId });
      }

      return await query.getCount();
    } catch (err) {
      this.loggerService.warn(`Wishlist/ findUserWishlistByUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserFavoritesByPageNation(uuid: string, page: number, limit: number, areaId?: number) {
    try {
      const query = this.favoriteRepository
        .createQueryBuilder('userFavorite')
        .leftJoinAndSelect('userFavorite.shop', 'shop')
        .leftJoinAndSelect('shop.region', 'region')
        .where('userFavorite.userUuid = :uuid', { uuid });

      if (areaId) {
        query.andWhere('region.id = :areaId', { areaId });
      }

      return await query
        .skip(limit * (page - 1)) // ✅ offset 설정 (페이징)
        .take(limit) // ✅ limit 설정
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Wishlist/ findUserWishlistByPageNation Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async isShopInUserWishlist(shopId: number, uuid: string) {
    try {
      return await this.favoriteRepository.findOne({
        where: {
          user: { uuid },
          shop: { id: shopId },
        },
      });
    } catch (err) {
      this.loggerService.warn(`Wishlist/ isShopInUserWishlist Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserFavoriteShopsByUser(userUUID: string) {
    return await this.favoriteRepository.find({
      where: {
        user: { uuid: userUUID },
      },
      relations: ['shop'],
    });
  }
}
