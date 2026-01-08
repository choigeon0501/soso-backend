import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from 'src/api/shop/entities/shop.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ShopRepository extends Repository<Shop> {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    private readonly loggerService: LoggerService,
    private dataSource: DataSource,
  ) {
    super(Shop, dataSource.createEntityManager());
  }

  async findShopsByKeyword(keyword: string, page: number, limit: number, lat: number, lng: number, radius: number = 6371) {
    try {
      return await this.shopRepository
        .createQueryBuilder('shop')
        .addSelect(
          `(${radius} * acos(
            cos(radians(:lat)) * cos(radians(shop.lat)) *
            cos(radians(shop.lng) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(shop.lat))
          ))`,
          'distance',
        )
        .where('(shop.name LIKE :keyword OR shop.location LIKE :keyword)', { keyword: `%${keyword}%` })
        .andWhere('shop.isVerified = :isVerified', { isVerified: true })
        .andWhere('shop.isHidden = :isHidden', { isHidden: false })
        .setParameters({ lat, lng, isVerified: true })
        .skip(limit * (page - 1))
        .take(limit)
        .getRawMany();
    } catch (err) {
      this.loggerService.warn(`Shop/ findShopsByKeyword Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllShopsCountByKeyword(keyword: string) {
    try {
      return await this.shopRepository
        .createQueryBuilder('shop')
        .where('shop.name LIKE :keyword', { keyword: `%${keyword}%` }) // 부분 검색
        .orWhere('shop.location LIKE :keyword', { keyword: `%${keyword}%` }) // 도로명 검색
        .andWhere('shop.isVerified = :isVerified', { isVerified: true }) // 특정 타입 필터링
        .andWhere('shop.isHidden = :isHidden', { isHidden: false })
        .getCount();
    } catch (err) {
      this.loggerService.warn(`Shop/ findAllShopsCountByKeyword Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findOnlyShopByShopId(shopId: number) {
    try {
      return await this.shopRepository.findOne({
        where: {
          id: shopId,
          isVerified: true,
          isHidden: false,
        },
      });
    } catch (err) {
      this.loggerService.warn(`Shop/ findOnlyShopByShopId Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findByShopIdForHiddenShop(shopId: number) {
    try {
      return await this.shopRepository.findOne({
        where: {
          id: shopId,
          isVerified: true,
        },
      });
    } catch (err) {
      this.loggerService.warn(`Shop/ findByShopIdForHiddenShop Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findShopByShopId(shopId: number) {
    try {
      return await this.shopRepository
        .createQueryBuilder('shop')
        .leftJoinAndSelect('shop.operatingHours', 'operatingHours', 'operatingHours.isVerified= :operatingHoursType', { operatingHoursType: true }) // 운영 시간 필터링
        .leftJoinAndSelect('shop.productMappings', 'productMapping', 'productMapping.isVerified = :productMappingType', { productMappingType: true }) // product_mapping에서 type=0 필터링
        .leftJoinAndSelect('productMapping.product', 'product') // product_mapping을 통해 product 조인
        .where('shop.id = :shopId', { shopId })
        .andWhere('shop.isVerified = :isVerified', { isVerified: true })
        .andWhere('shop.isHidden = :isHidden', { isHidden: false })
        .getOne();
    } catch (err) {
      this.loggerService.warn(`Shop/ findShopByShopId Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findShopsWithin1Km(
    lat: number,
    lng: number,
    distanceLimit: number,
    radius: number,
    sortByDistance = false, // 파라미터 이름 변경
  ) {
    try {
      let query = this.shopRepository
        .createQueryBuilder('shop')
        .addSelect(
          `
        (${radius} * acos(
          cos(radians(:lat)) * cos(radians(shop.lat)) *
          cos(radians(shop.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(shop.lat))
        ))`,
          'distance',
        )
        .where('shop.isVerified = :isVerified', { isVerified: true })
        .andWhere('shop.isHidden = :isHidden', { isHidden: false })
        .having('distance < :distanceLimit', { distanceLimit })
        .setParameters({ lat, lng });

      if (sortByDistance) {
        query = query.orderBy('distance', 'ASC');
      }

      return await query.getRawMany();
    } catch (err) {
      this.loggerService.warn(`Shop/ findShopsWithin1Km Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findShopsByProductIds(productIds: number[]) {
    return this.createQueryBuilder('shop')
      .innerJoin('shop.productMappings', 'productMapping')
      .where('productMapping.product.id IN (:...productIds)', { productIds })
      .andWhere('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .getMany();
  }

  async saveShop(shop: Shop) {
    return this.shopRepository.save(shop);
  }
}
