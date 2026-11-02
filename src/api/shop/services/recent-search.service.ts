import { Injectable } from '@nestjs/common';
import { RecentSearchRepository } from '../repositories/recent-search.repository';
import { MAX_RECENT_SEARCHES } from '../const/recent-search.const';
import { GetRecentSearchResponseDto } from '../dto/response/get-recent-search-response.dto';

@Injectable()
export class RecentSearchService {
  constructor(private readonly recentSearchRepository: RecentSearchRepository) {}

  async findMyRecentSearches(uuid: string): Promise<GetRecentSearchResponseDto[]> {
    if (!uuid) return [];

    const recentSearches = await this.recentSearchRepository.findByUuidWithShop(uuid);

    return recentSearches.map((recentSearch) => ({
      id: recentSearch.id,
      shopName: recentSearch.shop.name,
      shopId: recentSearch.shop.id,
    }));
  }

  /**
   * 같은 이름의 샵을 이미 검색했으면 기록하지 않는다.
   * 목록은 shop 관계만 불러오므로 oldest.user가 비어 있어 초과분 삭제 분기는 실행되지 않는다.
   */
  async recordRecentSearch(uuid: string, shopId: number, shopName: string): Promise<void> {
    const recentSearches = await this.recentSearchRepository.findByUuidWithShop(uuid);
    const alreadySearched = await this.recentSearchRepository.existsByUuidAndShopName(uuid, shopName);
    if (alreadySearched) return;

    const newRecentSearch = this.recentSearchRepository.create(uuid, shopId);
    if (recentSearches.length === MAX_RECENT_SEARCHES) {
      const oldest = recentSearches.pop();
      if (oldest?.user?.uuid) {
        await this.recentSearchRepository.deleteByIdAndUuid(oldest.id, oldest.user.uuid);
      }
    }
    recentSearches.unshift(newRecentSearch);

    await this.recentSearchRepository.saveAll(recentSearches);
  }

  async deleteAllRecentSearches(uuid: string): Promise<void> {
    await this.recentSearchRepository.deleteAllByUuid(uuid);
  }

  async deleteRecentSearch(recentSearchId: number, uuid: string): Promise<void> {
    await this.recentSearchRepository.deleteByIdAndUuid(recentSearchId, uuid);
  }
}
