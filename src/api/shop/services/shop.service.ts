import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ShopRepository } from '../repositories/shop.repository';
import { ShopReportRepository } from '../repositories/shop-report.repository';
import { RecentSearchService } from './recent-search.service';
import { ReviewService } from '../../review/services/review.service';
import { UserFavoriteService } from '../../user/services/user-favorite.service';
import { Shop } from '../entities/shop.entity';
import { normalizePhoneNumber } from '../utils/normalize-phone-number.util';
import { convertTimeToAmPm } from '../utils/convert-time-to-am-pm.util';
import { getLastSegment } from '../utils/get-last-segment.util';
import { GetNearbyShopsQueryDto } from '../dto/query/get-nearby-shops-query.dto';
import { SearchShopsQueryDto } from '../dto/query/search-shops-query.dto';
import { ReportShopDto } from '../dto/request/report-shop.dto';
import { ToggleShopHiddenDto } from '../dto/request/toggle-shop-hidden.dto';
import { SearchShopsResponseDto } from '../dto/response/search-shops-response.dto';
import { GetAllShopReportResponseDto } from '../dto/response/get-all-shop-report-response.dto';

@Injectable()
export class ShopService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopReportRepository: ShopReportRepository,
    private readonly recentSearchService: RecentSearchService,
    @Inject(forwardRef(() => ReviewService))
    private readonly reviewService: ReviewService,
    @Inject(forwardRef(() => UserFavoriteService))
    private readonly userFavoriteService: UserFavoriteService,
  ) {}

  /**
   * 위시리스트 필터는 반경 제한 없이 찜한 샵 전체를 거리와 함께 돌려준다.
   * 상품 필터는 위시리스트 필터와 함께 걸린다.
   */
  async findNearbyShops(query: GetNearbyShopsQueryDto, uuid: string) {
    const { lat, lng, sorting, isWishlist, productIds } = query;

    let rows;
    if (isWishlist && uuid) {
      const favoriteShopIds = await this.userFavoriteService.findFavoriteShopIds(uuid);
      if (favoriteShopIds.length === 0) {
        return [];
      }

      rows = await this.shopRepository.findVisibleByIdsWithDistance(favoriteShopIds, lat, lng, sorting);
    } else {
      rows = await this.shopRepository.findNearbyWithDistance(lat, lng, sorting);
    }

    const shops = rows.map((row) => ({
      id: row.shop_id,
      name: row.shop_name,
      isVerified: row.shop_is_verified,
      mainImage: row.shop_main_image,
      lat: row.shop_lat,
      lng: row.shop_lng,
      location: row.shop_location,
      regionId: row.shop_region_id,
      distance: row.distance,
    }));
    if (!productIds || productIds.length === 0) {
      return shops;
    }

    const shopIdsWithProducts = await this.shopRepository.findVisibleIdsByProductIds(productIds);

    return shops.filter((shop) => shopIdsWithProducts.includes(shop.id));
  }

  async searchShops(query: SearchShopsQueryDto): Promise<SearchShopsResponseDto> {
    const { keyword, page, limit, lat, lng } = query;

    const rows = await this.shopRepository.findVisibleByKeywordWithDistance(keyword, page, limit, lat, lng);
    const totalElements = await this.shopRepository.countVisibleByKeyword(keyword);

    const totalPages = Math.ceil(totalElements / limit);

    return {
      data: rows.map((row) => ({
        id: row.shop_id,
        name: row.shop_name,
        mainImage: row.shop_main_image,
        location: row.shop_location ?? null,
        lat: Number(row.shop_lat),
        lng: Number(row.shop_lng),
        distance: Number(row.distance),
      })),
      pageInfo: { page, limit, totalElements, totalPages, nextPage: page < totalPages },
    };
  }

  async getShopDetail(shopId: number, uuid: string) {
    const shop = await this.shopRepository.findVisibleDetailById(shopId);
    if (!shop) {
      throw new NotFoundException('NOT_FOUND_SHOP');
    }

    const { productMappings, operatingHours, ...shopBase } = shop;
    const { userReviews, otherReviews } = await this.reviewService.findShopReviews(shopId, uuid);
    let wishlist = false;
    if (uuid) {
      wishlist = await this.userFavoriteService.existsFavorite(shopId, uuid);
      await this.recentSearchService.recordRecentSearch(uuid, shopId, shop.name);
    }

    return {
      shop: {
        ...shopBase,
        instagramId: getLastSegment(shop.instagram),
        operatingHours: operatingHours.map((operatingHour) => ({
          ...operatingHour,
          phoneNumber: normalizePhoneNumber(operatingHour.phoneNumber),
          startTime: convertTimeToAmPm(operatingHour.startTime),
          endTime: convertTimeToAmPm(operatingHour.endTime),
        })),
        products: productMappings.map((mapping) => ({ id: mapping.product.id, name: mapping.product.name })),
      },
      userReviews,
      otherReviews,
      wishlist,
      imageList: [...userReviews, ...otherReviews].flatMap((review) => review.images),
    };
  }

  async findVisibleShop(shopId: number): Promise<Shop | null> {
    return this.shopRepository.findVisibleById(shopId);
  }

  async findVerifiedShopIds(shopIds: number[]): Promise<number[]> {
    return this.shopRepository.findVerifiedIdsByIds(shopIds);
  }

  async toggleShopHidden(shopId: number, body: ToggleShopHiddenDto): Promise<void> {
    const shop = await this.shopRepository.findVerifiedById(shopId);
    if (!shop) {
      throw new ConflictException('Not Exist Shop');
    }

    shop.isHidden = body.isHidden;

    await this.shopRepository.save(shop);
  }

  async reportShop(shopId: number, body: ReportShopDto, uuid: string): Promise<void> {
    const shop = await this.shopRepository.findVisibleById(shopId);
    if (!shop) {
      throw new NotFoundException('Not exist shop');
    }

    const alreadyReported = await this.shopReportRepository.existsByUuidAndShopId(uuid, shopId);
    if (alreadyReported) {
      throw new ConflictException('Exist Report Shop');
    }

    await this.shopReportRepository.create(uuid, shop.id, body);
  }

  /**
   * 신고 한 건이 한 행이고, reportCount는 같은 샵의 누적 신고 수다. 누적 수 내림차순으로 정렬한 뒤 번호를 매긴다.
   */
  async findAllShopReportsForAdmin(): Promise<GetAllShopReportResponseDto[]> {
    const shopReports = await this.shopReportRepository.findAllWithShopAndUser();

    const reportCountByShopId: Record<number, number> = {};
    for (const report of shopReports) {
      reportCountByShopId[report.shop.id] = (reportCountByShopId[report.shop.id] || 0) + 1;
    }
    const reports = shopReports.map((report) => ({
      userEmail: report.user.email,
      shopId: report.shop.id,
      shopName: report.shop.name,
      shopLocation: report.shop.location,
      reportType: report.reportType,
      reportCount: reportCountByShopId[report.shop.id],
      reportDate: report.createdAt,
      isHidden: report.shop.isHidden,
    }));
    reports.sort((a, b) => b.reportCount - a.reportCount);

    return reports.map((report, index) => ({ num: index + 1, ...report }));
  }
}
