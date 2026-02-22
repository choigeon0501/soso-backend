import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { UserFavorite } from '../entities/user-favorite.entity';

@Injectable()
export class UserFavoriteRepository {
  constructor(
    @InjectRepository(UserFavorite)
    private favoriteRepository: Repository<UserFavorite>,
  ) {}

  async findUserFavoriteByShopIdAndUUID(shopId: number, uuid: string) {
    return await this.favoriteRepository.findOne({
      where: {
        user: { uuid },
        shop: { id: shopId },
      },
      relations: ['user', 'shop'],
    });
  }

  async deleteUserFavoriteByUserFavoritesId(userFavoriteId: number) {
    return await this.favoriteRepository.delete({
      id: userFavoriteId,
    });
  }

  async addUserFavoriteByShopIdAndUUID(shopId: number, uuid: string) {
    return await this.favoriteRepository.save({
      user: { uuid }, // User 엔티티와 연결
      shop: { id: shopId }, // Shop 엔티티와 연결
    });
  }

  async findUserFavoritesCountByUUID(uuid: string, areaId?: number) {
    const qb = this.favoriteRepository
      .createQueryBuilder('uf')
      .leftJoin('uf.shop', 's')
      .leftJoin('s.region', 'r')
      .where('uf.user.uuid = :uuid', { uuid });
    if (areaId) {
      qb.andWhere('r.id = :areaId', { areaId });
    }
    return qb.getCount();
  }

  async findUserFavoritesByPageNation(uuid: string, page: number, limit: number, areaId?: number) {
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
  }

  async isShopInUserWishlist(shopId: number, uuid: string) {
    return await this.favoriteRepository.findOne({
      where: {
        user: { uuid },
        shop: { id: shopId },
      },
    });
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
