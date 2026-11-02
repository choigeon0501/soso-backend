import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Shop } from '../entities/shop.entity';
import { EARTH_RADIUS_KM, NEARBY_DISTANCE_LIMIT_KM } from '../const/distance.const';

@Injectable()
export class ShopRepository {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async findVisibleByKeywordWithDistance(keyword: string, page: number, limit: number, lat: number, lng: number) {
    return this.shopRepository
      .createQueryBuilder('shop')
      .addSelect(
        `(${EARTH_RADIUS_KM} * acos(
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
  }

  async countVisibleByKeyword(keyword: string): Promise<number> {
    return this.shopRepository
      .createQueryBuilder('shop')
      .where('shop.name LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('shop.location LIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .getCount();
  }

  async findVisibleById(shopId: number): Promise<Shop | null> {
    return this.shopRepository.findOne({ where: { id: shopId, isVerified: true, isHidden: false } });
  }

  async findVerifiedById(shopId: number): Promise<Shop | null> {
    return this.shopRepository.findOne({ where: { id: shopId, isVerified: true } });
  }

  async findVerifiedIdsByIds(shopIds: number[]): Promise<number[]> {
    if (shopIds.length === 0) return [];

    const shops = await this.shopRepository.find({ select: { id: true }, where: { id: In(shopIds), isVerified: true } });

    return shops.map((shop) => shop.id);
  }

  async findVisibleDetailById(shopId: number): Promise<Shop | null> {
    return this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.operatingHours', 'operatingHours', 'operatingHours.isVerified= :operatingHoursType', { operatingHoursType: true })
      .leftJoinAndSelect('shop.productMappings', 'productMapping', 'productMapping.isVerified = :productMappingType', { productMappingType: true })
      .leftJoinAndSelect('productMapping.product', 'product')
      .where('shop.id = :shopId', { shopId })
      .andWhere('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .getOne();
  }

  async findNearbyWithDistance(lat: number, lng: number, sortByDistance: boolean) {
    const query = this.shopRepository
      .createQueryBuilder('shop')
      .addSelect(
        `(${EARTH_RADIUS_KM} * acos(
          cos(radians(:lat)) * cos(radians(shop.lat)) *
          cos(radians(shop.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(shop.lat))
        ))`,
        'distance',
      )
      .where('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .having('distance < :distanceLimit', { distanceLimit: NEARBY_DISTANCE_LIMIT_KM })
      .setParameters({ lat, lng });
    if (sortByDistance) {
      query.orderBy('distance', 'ASC');
    }

    return query.getRawMany();
  }

  async findVisibleByIdsWithDistance(shopIds: number[], lat: number, lng: number, sortByDistance: boolean) {
    if (shopIds.length === 0) return [];

    const query = this.shopRepository
      .createQueryBuilder('shop')
      .addSelect(
        `(${EARTH_RADIUS_KM} * acos(
          cos(radians(:lat)) * cos(radians(shop.lat)) *
          cos(radians(shop.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(shop.lat))
        ))`,
        'distance',
      )
      .where('shop.id IN (:...shopIds)', { shopIds })
      .andWhere('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .setParameters({ lat, lng });
    if (sortByDistance) {
      query.orderBy('distance', 'ASC');
    }

    return query.getRawMany();
  }

  async findVisibleIdsByProductIds(productIds: number[]): Promise<number[]> {
    if (productIds.length === 0) return [];

    const shops = await this.shopRepository
      .createQueryBuilder('shop')
      .innerJoin('shop.productMappings', 'productMapping')
      .where('productMapping.product.id IN (:...productIds)', { productIds })
      .andWhere('shop.isVerified = :isVerified', { isVerified: true })
      .andWhere('shop.isHidden = :isHidden', { isHidden: false })
      .getMany();

    return shops.map((shop) => shop.id);
  }

  async save(shop: Shop): Promise<Shop> {
    return this.shopRepository.save(shop);
  }
}
