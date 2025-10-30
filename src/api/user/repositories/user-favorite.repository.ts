import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { UserFavorite } from '../../../database/entity/user-favorite.entity';

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

  async findUserFavoritesCountByUUID(uuid: string, areaId?: number) {
    try {
      const qb = this.favoriteRepository
        .createQueryBuilder('uf')
        .leftJoin('uf.shop', 's')
        .leftJoin('s.region', 'r')
        .where('uf.user_id = :uuid', { uuid });
      if (areaId) {
        qb.andWhere('r.id = :areaId', { areaId });
      }
      return qb.getCount();
    } catch (err) {
      this.loggerService.warn(`Wishlist/ findUserWishlistByUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserFavoritesByPageNation(uuid: string, page: number, limit: number, areaId?: number) {
    try {
      const qb = this.favoriteRepository
        .createQueryBuilder('uf')
        .innerJoin('uf.user', 'u') // ← user 조인
        .leftJoinAndSelect('uf.shop', 's')
        .leftJoinAndSelect('s.region', 'r')
        .where('u.uuid = :uuid', { uuid }); // ← 관계의 uuid로 필터

      if (areaId) {
        qb.andWhere('r.id = :areaId', { areaId });
      }

      return await qb
        .orderBy('uf.createdAt', 'DESC') // 페이징 일관성 확보 권장
        .skip((page - 1) * limit)
        .take(limit)
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
