import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { UserFavoriteRepository } from '../repositories/user-favorite.repository';
import { ShopService } from '../../shop/services/shop.service';
import { UserFavorite } from '../entities/user-favorite.entity';
import { GetUserFavoritesQueryDto } from '../dto/query/get-user-favorites-query.dto';
import { ToggleUserFavoriteDto } from '../dto/request/toggle-user-favorite.dto';
import { GetUserFavoritesResponseDto } from '../dto/response/get-user-favorites-response.dto';

@Injectable()
export class UserFavoriteService {
  constructor(
    private readonly userFavoriteRepository: UserFavoriteRepository,
    @Inject(forwardRef(() => ShopService))
    private readonly shopService: ShopService,
  ) {}

  async findMyFavorites(query: GetUserFavoritesQueryDto, uuid: string): Promise<GetUserFavoritesResponseDto> {
    const { page, limit, areaId } = query;

    const totalElements = await this.userFavoriteRepository.countByUuid(uuid, areaId);
    const favorites = await this.userFavoriteRepository.findByUuidWithShop(uuid, page, limit, areaId);

    const totalPages = Math.ceil(totalElements / limit);

    return {
      data: favorites.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        shop: { id: favorite.shop.id, name: favorite.shop.name, mainImage: favorite.shop.mainImage ?? null },
      })),
      pageInfo: { page, limit, totalElements, totalPages, nextPage: page < totalPages },
    };
  }

  /**
   * 이미 찜했으면 해제, 아니면 찜한다. 응답 result에 삭제 결과 또는 저장된 찜이 그대로 실린다(앱 계약).
   */
  async toggleFavorite(body: ToggleUserFavoriteDto, uuid: string): Promise<DeleteResult | UserFavorite> {
    const { shopId } = body;

    const shop = await this.shopService.findVisibleShop(shopId);
    if (!shop) {
      throw new NotFoundException('Not Found Shop');
    }

    const favorite = await this.userFavoriteRepository.findByShopIdAndUuid(shopId, uuid);
    if (favorite) {
      return this.userFavoriteRepository.deleteById(favorite.id);
    }

    return this.userFavoriteRepository.create(shopId, uuid);
  }

  async existsFavorite(shopId: number, uuid: string): Promise<boolean> {
    return this.userFavoriteRepository.existsByShopIdAndUuid(shopId, uuid);
  }

  async findFavoriteShopIds(uuid: string): Promise<number[]> {
    return this.userFavoriteRepository.findShopIdsByUuid(uuid);
  }
}
