import { InjectRepository } from '@nestjs/typeorm';
import { RecentSearch } from '../entities/shop-recent-search.entity';
import { Repository } from 'typeorm';

export class ShopRecentSearchRepository {
  constructor(
    @InjectRepository(RecentSearch)
    private recentSearchRepository: Repository<RecentSearch>,
  ) {}

  async findRecentSearchListByUUID(uuid: string): Promise<RecentSearch[]> {
    return await this.recentSearchRepository.find({
      where: {
        user: { uuid },
      },
      order: { createdAt: 'DESC' }, // 최신 순 정렬
      relations: ['shop'],
    });
  }

  async createRecentSearch(uuid: string, shopId: number): Promise<RecentSearch> {
    return this.recentSearchRepository.create({ user: { uuid }, shop: { id: shopId } });
  }

  async saveRecentSearch(recentSearch: RecentSearch[]): Promise<RecentSearch[]> {
    return await this.recentSearchRepository.save(recentSearch);
  }

  async checkRecentSearchByShopName(uuid: string, shopName: string): Promise<RecentSearch | null> {
    return await this.recentSearchRepository.findOne({
      where: {
        user: { uuid },
        shop: { name: shopName },
      },
    });
  }

  async deleteRecentSearch(uuid: string, recentSearchId: number): Promise<void> {
    await this.recentSearchRepository.delete({
      id: recentSearchId,
      user: { uuid },
    });
  }

  async deleteAllRecentSearch(uuid: string): Promise<void> {
    await this.recentSearchRepository.delete({ user: { uuid } });
  }
}
