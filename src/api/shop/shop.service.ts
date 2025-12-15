import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ShopRepository } from './repositories/shop.repository';
import { RegionRepository } from '../region/region.repository';
import { ShopRecentSearchRepository } from './repositories/shop-recent-search.repository';
import { convertTimeToAmPm } from '../../common/function/time-to-am-pm.function';
import { getLastSegment } from 'src/common/function/get-insta-id';
import { ShopSubmitTransactionsRepository } from './repositories/shop-submit-transactions.repository';
import { ShopSubmitRepository } from './repositories/shop-submit.repository';
import { ReviewRepository } from '../review/repositories/review.repository';
import { ReviewTransactionsRepository } from '../review/repositories/review-transactions.repository';
import { ReviewService } from '../review/review.service';
import { ShopReportRepository } from './repositories/shop-report.repository';
import { GetSearchPageShopDTO, GetShopWithin1KmDTO } from './dto/query/pagination.dto';
import { SubmitNewProductsDto, SubmitNewShopDto, SubmitShopOperatingHoursDto } from './dto/requests/submit_shop_requests.dto';
import { PostReviewDto, UpdateReviewDto } from './dto/requests/review_request.dto';
import { Paging } from './dto/responses/pagination_response.dto';
import { ShopSearchPageNationResultDTO } from './dto/responses/shop_response.dto';
import { ReviewReportDto, ShopReportDto } from './dto/requests/report_request';
import { UserFavoriteRepository } from '../user/repositories/user-favorite.repository';
import { SubmitType } from '../../common/enum/role.enum';
import { ReviewBanRepository } from '../review/repositories/review-ban.repository';
import { ReviewReportRepository } from '../review/repositories/review-report.repository';
import { AwsService } from '../../common/aws/aws.service';

@Injectable()
export class ShopService {
  constructor(
    private shopRepository: ShopRepository,
    private reviewService: ReviewService,
    private userFavoriteRepository: UserFavoriteRepository,
    private regionRepository: RegionRepository,
    private recentSearchRepository: ShopRecentSearchRepository,
    private shopSubmitTransactionsRepository: ShopSubmitTransactionsRepository,
    private submitRepository: ShopSubmitRepository,
    private reviewRepository: ReviewRepository,
    private reviewTransactionsRepository: ReviewTransactionsRepository,
    private shopReportRepository: ShopReportRepository,
    private reviewReportRepository: ReviewReportRepository,
    private reviewBanRepository: ReviewBanRepository,
    private awsService: AwsService,
  ) {}

  async findShopsWithin1Km(getShopWithin1KmDTO: GetShopWithin1KmDTO, uuid: string) {
    const { lat, lng, sorting, isWishlist, productIds } = getShopWithin1KmDTO;
    const radius = 6371; // 지구 반경 (km)
    const distanceLimit = 1; // 거리 제한 (1km)

    let shops = await this.shopRepository.findShopsWithin1Km(lat, lng, distanceLimit, radius, sorting);

    // shop_ 프리픽스 제거 + 필요한 필드만 추출
    shops = shops.map((shop) => ({
      id: shop.shop_id,
      name: shop.shop_name,
      isVerified: shop.shop_is_verified,
      mainImage: shop.shop_main_image,
      lat: shop.shop_lat,
      lng: shop.shop_lng,
      location: shop.shop_location,
      regionId: shop.shop_region_id,
      distance: shop.distance,
    }));

    if (isWishlist && uuid) {
      const userFavoriteShops = await this.userFavoriteRepository.findUserFavoriteShopsByUser(uuid);
      const userFavoriteShopsIds = userFavoriteShops.map((wishlist) => wishlist.shop.id);
      shops = shops.filter((shop) => userFavoriteShopsIds.includes(shop.id));
    }

    if (productIds && productIds.length > 0) {
      const shopsWithProducts = await this.shopRepository.findShopsByProductIds(productIds);
      const shopIdsWithProducts = shopsWithProducts.map((shop) => shop.id);
      shops = shops.filter((shop) => shopIdsWithProducts.includes(shop.id));
    }

    return shops;
  }

  async findShopsByKeyword(getSearchPageShopDTO: GetSearchPageShopDTO) {
    const { keyword, page, limit, lat, lng } = getSearchPageShopDTO;
    const radius = 6371; // 지구 반경 (km)

    const rawResults = await this.shopRepository.findShopsByKeyword(keyword, page, limit, lat, lng, radius);

    const mappedResults = await Promise.all(
      rawResults.map(async (shop) => {
        return {
          id: shop.shop_id,
          name: shop.shop_name,
          mainImage: shop.shop_main_image,
          location: shop.shop_location ?? null,
          lat: Number(shop.shop_lat),
          lng: Number(shop.shop_lng),
          distance: Number(shop.distance),
        };
      }),
    );

    const allShopsCount = await this.shopRepository.findAllShopsCountByKeyword(keyword);
    const totalPages = Math.ceil(allShopsCount / limit);
    const pageInfoDTO = new Paging(page, limit, allShopsCount, totalPages, page < totalPages);

    return new ShopSearchPageNationResultDTO(mappedResults, pageInfoDTO);
  }

  async createNewShop(newShopData: SubmitNewShopDto, uuid: string): Promise<void> {
    const region = await this.regionRepository.findRegionByLocation(newShopData.shop.location);
    if (!region) throw new NotFoundException('check region location');

    await this.shopSubmitTransactionsRepository.createNewShop(newShopData, region.id, uuid);
  }

  async findShopByShopId(shopId: number, uuid: string) {
    const imageList = [];

    const shop = await this.shopRepository.findShopByShopId(shopId);
    if (!shop) {
      throw new NotFoundException('NOT_FOUND_SHOP');
    }

    // "productMappings" 배열을 "products" 배열로 변환
    const products = shop.productMappings.map((mapping) => ({
      id: mapping.product.id,
      name: mapping.product.name,
    }));

    const operatingHours = shop.operatingHours.map((operating) => ({
      ...operating,
      startTime: convertTimeToAmPm(operating.startTime),
      endTime: convertTimeToAmPm(operating.endTime),
    }));

    delete shop.productMappings; // 기존 productMappings 제거
    delete shop.operatingHours;

    // 기존 shop 객체에서 "productMappings" 제거 후 "products" 추가
    const transformedShop = {
      ...shop,
      instagramId: getLastSegment(shop.instagram),
      operatingHours,
      products, // 새로운 products 배열 추가
    };

    const { userReviews, otherReviews } = await this.reviewService.findShopReviewsByShopId(shopId, uuid);
    userReviews.forEach((review) => {
      imageList.push(...review.images);
    });

    otherReviews.forEach((review) => {
      imageList.push(...review.images);
    });

    const wishlist = !!(await this.userFavoriteRepository.isShopInUserWishlist(shopId, uuid));

    if (uuid) {
      const userRecentSearchList = (await this.recentSearchRepository.findRecentSearchListByUUID(uuid)) || [];
      const checkRecentSearchByShopName = await this.recentSearchRepository.checkRecentSearchByShopName(uuid, shop.name);
      if (!checkRecentSearchByShopName) {
        const newUserRecentSearch = await this.recentSearchRepository.createRecentSearch(uuid, shopId);
        if (userRecentSearchList.length == 10) {
          const deleteData = userRecentSearchList.pop();
          await this.recentSearchRepository.deleteRecentSearch(deleteData.user.uuid, deleteData.id);
        }
        userRecentSearchList.unshift(newUserRecentSearch);
        await this.recentSearchRepository.saveRecentSearch(userRecentSearchList);
      }
    }

    return {
      shop: transformedShop,
      userReviews,
      otherReviews,
      wishlist,
      imageList,
    };
  }

  async validateAndUpdateOperatingHours(shopId: number, operatingData: SubmitShopOperatingHoursDto, uuid: string): Promise<void> {
    // 운영정보 업데이트시 해당 소품샵이 존재하는지 체크
    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new ConflictException('Not Exist Shop');

    const existData = await this.submitRepository.findUserSubmitRecordByType(uuid, shopId, SubmitType.NewOperating);
    if (existData) throw new ConflictException('Exist Data');

    await this.shopSubmitTransactionsRepository.createOperatingHours(shopId, operatingData, uuid);
  }

  async validateAndUpdateProducts(shopId: number, productsData: SubmitNewProductsDto, uuid: string): Promise<void> {
    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new ConflictException('Not Exist Shop');

    const existData = await this.submitRepository.findUserSubmitRecordByType(uuid, shopId, SubmitType.NewProduct);
    if (existData) throw new ConflictException('Exist Data');

    await this.shopSubmitTransactionsRepository.createProducts(shopId, productsData, uuid);
  }

  async createReview(uuid: string, postReviewDto: PostReviewDto, shopId: number, reviewImages?: Express.Multer.File[]): Promise<void> {
    const { content } = postReviewDto;

    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new NotFoundException('Not Exist Shop');

    // 리뷰 밴 테이블에 사용자가 존재하는지 검사
    const isExistUser = await this.reviewBanRepository.findUserReviewBanByUuid(uuid);
    if (isExistUser) throw new ConflictException('Can not post review.');

    const reviewImagesUrl = reviewImages ? await this.awsService.uploadImagesToS3(reviewImages, 'review') : [];

    // 트랜잭션을 사용하여 Review 생성
    await this.reviewTransactionsRepository.createReview(uuid, shopId, content, reviewImagesUrl);
  }

  async updateReview(
    uuid: string,
    updateReviewDto: UpdateReviewDto,
    shopId: number,
    reviewId: number,
    newReviewImage?: Express.Multer.File[],
  ): Promise<void> {
    const { content, deleteReviewImages } = updateReviewDto;

    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new NotFoundException('Not Exist Shop');

    // 리뷰 밴 테이블에 사용자가 존재하는지 검사
    const isExistUser = await this.reviewBanRepository.findUserReviewBanByUuid(uuid);
    if (isExistUser) throw new ConflictException('Can not post review.');

    // 새 리뷰 이미지가 존재하면 업로드
    const newReviewImageUrls = newReviewImage?.length > 0 ? await this.awsService.uploadImagesToS3(newReviewImage, 'review') : [];

    // 트랜잭션을 사용하여 Review 업데이트
    await this.reviewTransactionsRepository.updateReview(uuid, reviewId, content, deleteReviewImages, newReviewImageUrls);
  }

  async deleteReviewByUUID(uuid: string, shopId: number, reviewId: number): Promise<void> {
    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new ConflictException('Not Exist Shop');

    const existData = await this.reviewRepository.findOneReviewById(reviewId);
    if (!existData) throw new ConflictException('Not Exist Review');

    await this.reviewTransactionsRepository.deleteReview(uuid, reviewId);
  }

  async reportReview(uuid: string, reviewReportDto: ReviewReportDto, shopId: number, reviewId: number): Promise<void> {
    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new ConflictException('Not Exist Shop');

    const review = await this.reviewRepository.findOneReviewById(reviewId);
    if (!review) throw new NotFoundException('Not exist review');

    const existData = await this.reviewReportRepository.findReviewReport(uuid, reviewId);
    if (existData) throw new ConflictException('Exist Report Review');

    await this.reviewReportRepository.saveReviewReport(uuid, reviewId, reviewReportDto);
  }

  async reportShop(uuid: string, shopReportDto: ShopReportDto, shopId: number): Promise<void> {
    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new NotFoundException('Not exist shop');

    const existData = await this.shopReportRepository.findShopReport(uuid, shopId);
    if (existData) throw new ConflictException('Exist Report Shop');

    await this.shopReportRepository.saveShopReport(uuid, shop.id, shopReportDto);
  }
}
