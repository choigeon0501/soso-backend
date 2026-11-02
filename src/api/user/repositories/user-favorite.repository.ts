import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserFavorite } from '../entities/user-favorite.entity';

@Injectable()
export class UserFavoriteRepository {
  constructor(
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
  ) {}

  async findByShopIdAndUuid(shopId: number, uuid: string): Promise<UserFavorite | null> {
    return this.userFavoriteRepository.findOne({ where: { user: { uuid }, shop: { id: shopId } }, relations: ['user', 'shop'] });
  }

  async existsByShopIdAndUuid(shopId: number, uuid: string): Promise<boolean> {
    return this.userFavoriteRepository.exists({ where: { user: { uuid }, shop: { id: shopId } } });
  }

  async findShopIdsByUuid(uuid: string): Promise<number[]> {
    const favorites = await this.userFavoriteRepository.find({ where: { user: { uuid } }, relations: ['shop'] });

    return favorites.map((favorite) => favorite.shop.id);
  }

  async countByUuid(uuid: string, areaId?: number): Promise<number> {
    const query = this.userFavoriteRepository
      .createQueryBuilder('uf')
      .leftJoin('uf.shop', 's')
      .leftJoin('s.region', 'r')
      .where('uf.user.uuid = :uuid', { uuid });
    if (areaId) {
      query.andWhere('r.id = :areaId', { areaId });
    }

    return query.getCount();
  }

  async findByUuidWithShop(uuid: string, page: number, limit: number, areaId?: number): Promise<UserFavorite[]> {
    const query = this.userFavoriteRepository
      .createQueryBuilder('uf')
      .innerJoin('uf.user', 'u')
      .leftJoinAndSelect('uf.shop', 's')
      .leftJoinAndSelect('s.region', 'r')
      .where('u.uuid = :uuid', { uuid });
    if (areaId) {
      query.andWhere('r.id = :areaId', { areaId });
    }

    return query
      .orderBy('uf.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async create(shopId: number, uuid: string): Promise<UserFavorite> {
    return this.userFavoriteRepository.save({ user: { uuid }, shop: { id: shopId } });
  }

  async deleteById(userFavoriteId: number): Promise<DeleteResult> {
    return this.userFavoriteRepository.delete({ id: userFavoriteId });
  }
}
