import { InjectRepository } from '@nestjs/typeorm';
import { RecentSearch } from '../../../database/entity/recent-search.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { InternalServerErrorException } from '@nestjs/common';

export class ShopRecentSearchRepository {
  constructor(
    @InjectRepository(RecentSearch)
    private recentSearchRepository: Repository<RecentSearch>,
    private readonly loggerService: LoggerService,
  ) {}

  async findRecentSearchListByUUID(uuid: string): Promise<RecentSearch[]> {
    try {
      return await this.recentSearchRepository.find({
        where: {
          user: { uuid },
        },
        order: { createdAt: 'DESC' }, // 최신 순 정렬
        relations: ['shop'],
      });
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ findRecentSearchListByUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async createRecentSearch(uuid: string, shopId: number): Promise<RecentSearch> {
    try {
      return await this.recentSearchRepository.create({ user: { uuid }, shop: { id: shopId } });
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ createRecentSearch Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async saveRecentSearch(recentSearch: RecentSearch[]): Promise<RecentSearch[]> {
    try {
      return await this.recentSearchRepository.save(recentSearch);
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ saveRecentSearch Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async checkRecentSearchByShopName(uuid: string, shopName: string): Promise<RecentSearch | null> {
    try {
      return await this.recentSearchRepository.findOne({
        where: {
          user: { uuid },
          shop: { name: shopName },
        },
      });
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ checkRecentSearchByShopName Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async deleteRecentSearch(uuid: string, recentSearchId: number): Promise<void> {
    try {
      await this.recentSearchRepository.delete({
        id: recentSearchId,
        user: { uuid },
      });
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ deleteRecentSearch Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async deleteAllRecentSearch(uuid: string): Promise<void> {
    try {
      await this.recentSearchRepository.delete({ user: { uuid } });
    } catch (err) {
      this.loggerService.warn(`Recent-Search/ deleteRecentSearch Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
