import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecentSearch } from '../entities/shop-recent-search.entity';

@Injectable()
export class RecentSearchRepository {
  constructor(
    @InjectRepository(RecentSearch)
    private readonly recentSearchRepository: Repository<RecentSearch>,
  ) {}

  async findByUuidWithShop(uuid: string): Promise<RecentSearch[]> {
    return this.recentSearchRepository.find({
      where: { user: { uuid } },
      order: { createdAt: 'DESC' },
      relations: ['shop'],
    });
  }

  async existsByUuidAndShopName(uuid: string, shopName: string): Promise<boolean> {
    return this.recentSearchRepository.exists({ where: { user: { uuid }, shop: { name: shopName } } });
  }

  create(uuid: string, shopId: number): RecentSearch {
    return this.recentSearchRepository.create({ user: { uuid }, shop: { id: shopId } });
  }

  async saveAll(recentSearches: RecentSearch[]): Promise<RecentSearch[]> {
    return this.recentSearchRepository.save(recentSearches);
  }

  async deleteByIdAndUuid(recentSearchId: number, uuid: string): Promise<void> {
    await this.recentSearchRepository.delete({ id: recentSearchId, user: { uuid } });
  }

  async deleteAllByUuid(uuid: string): Promise<void> {
    await this.recentSearchRepository.delete({ user: { uuid } });
  }
}
