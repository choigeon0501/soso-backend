import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from 'src/database/entity/user-favorite.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WishlistRepository extends Repository<Wishlist> {
  constructor(
    @InjectRepository(Wishlist)
    private whishlistRepository: Repository<Wishlist>,
    private loggerService: LoggerService,
    private dataSource: DataSource,
  ) {
    super(Wishlist, dataSource.createEntityManager());
  }

  async findWishlistByShopIdAndUUID(shopId: number, uuid: string) {
    try {
      return await this.whishlistRepository.findOne({
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

  async deleteWishlistByWishlistId(wishlistId: number) {
    try {
      return await this.whishlistRepository.delete({
        id: wishlistId,
      });
    } catch (err) {
      this.loggerService.warn(`Wishlist/ deleteWishlistByWishlistId Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async addWishlistByShopIdAndUUID(shopId: number, uuid: string) {
    try {
      return await this.whishlistRepository.save({
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
      const query = this.whishlistRepository
        .createQueryBuilder('wishlist')
        .leftJoinAndSelect('wishlist.shop', 'shop')
        .leftJoinAndSelect('shop.region', 'region')
        .where('wishlist.userUuid = :uuid', { uuid });

      if (areaId) {
        query.andWhere('region.id = :areaId', { areaId });
      }

      return await query.getCount();
    } catch (err) {
      this.loggerService.warn(`Wishlist/ findUserWishlistByUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserWishlistByPageNation(uuid: string, page: number, limit: number, areaId?: number) {
    try {
      const query = this.whishlistRepository
        .createQueryBuilder('wishlist')
        .leftJoinAndSelect('wishlist.shop', 'shop')
        .leftJoinAndSelect('shop.region', 'region')
        .where('wishlist.userUuid = :uuid', { uuid });

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
      return await this.whishlistRepository.findOne({
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

  async findWishlistShopsByUser(userUUID: string) {
    return this.find({
      where: {
        user: { uuid: userUUID },
      },
      relations: ['shop'],
    });
  }
}
