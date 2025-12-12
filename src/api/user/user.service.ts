import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { AwsService } from '../../common/aws/aws.service';
import { ReviewRepository } from '../review/repositories/review.repository';
import { ShopSubmitRepository } from '../shop/repositories/shop-submit.repository';
import { UserFavoriteRepository } from './repositories/user-favorite.repository';

import { ValidateNickNameDTO, WithdrawalReasonDTO } from './dto/query/user.dto';
import { PaginationQueryDTO } from './dto/query/pagination.dto';
import { UpdateProfileDTO } from './dto/requests/user_requests.dto';

import { PresignedUserProfileImgResponsesDTO, UserProfileResponsesDTO } from './dto/responses/user_responses.dto';
import { PageInfoDTO } from './dto/responses/pagination_responses.dto';
import { UserSubmitRecordDTO, UserSubmitRecordItemDTO } from './dto/responses/submit_responses.dto';
import { UserReviewsRecordDTO, UserReviewsRecordItemDTO } from './dto/responses/review_responses.dto';
import { RecentSearchResponsesDto } from './dto/responses/recent_search_responses.dto';

import { ShopSubmitRecord } from '../shop/entities/shop-submit-user-record.entity';
import { UserTransactionsRepository } from './repositories/user-transactions.repository';
import { ShopRecentSearchRepository } from '../shop/repositories/shop-recent-search.repository';
import { SubmitType } from '../../common/enum/role.enum';
import { ShopSubmitTransactionsRepository } from '../shop/repositories/shop-submit-transactions.repository';
import { ShopRepository } from '../shop/repositories/shop.repository';
import { UserFavoriteRequestsDto } from './dto/requests/wishlist_requests.dto';
import { ReviewPaginationDTO } from './dto/query/review.dto';
import { UserFavoritePageNationDTO } from './dto/query/wishlist.dto';
import { UserFavoriteRecordDTO, UserFavoriteRecordItemDTO } from './dto/responses/user_favorite_responses.dto';
import { AuthIdentityRepository } from '../auth/repositories/auth-identity.repository';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private authIdentityRepository: AuthIdentityRepository,
    private awsService: AwsService,
    private reviewRepository: ReviewRepository,
    private userFavoriteRepository: UserFavoriteRepository,
    private submitRepository: ShopSubmitRepository,
    private recentSearchRepository: ShopRecentSearchRepository,
    private userTransactionsRepository: UserTransactionsRepository,
    private shopSubmitTransactionsRepository: ShopSubmitTransactionsRepository,
    private shopRepository: ShopRepository,
  ) {}

  async getUserProfile(uuid: string): Promise<UserProfileResponsesDTO> {
    const user = await this.userRepository.findUserByUUID(uuid);
    if (!user) throw new NotFoundException('Not Found User');

    const userAuthIdentity = await this.authIdentityRepository.findAuthIdentityByUuid(uuid);
    if (!userAuthIdentity) throw new NotFoundException('Not Found User');

    // PresignedURL 발급
    user.profileImg = user.profileImg ? await this.awsService.getPresignedGetUrlByKey(user.profileImg) : null;

    return new UserProfileResponsesDTO(user, userAuthIdentity.provider);
  }

  async updateUserProfile(updateProfileDTO: UpdateProfileDTO, uuid: string, file: Express.Multer.File | null = null) {
    const { nickName, profileImgKey } = updateProfileDTO;

    if (nickName && profileImgKey) {
      return this.userTransactionsRepository.updateUser(nickName, profileImgKey, uuid);
    }

    if (nickName) {
      const existNickName = await this.userRepository.findUserByNickName(nickName);
      if (existNickName) throw new ConflictException('Nickname already exists.');

      const newNickName = await this.userRepository.updateNickName(uuid, nickName);
      if (newNickName.affected == 0) throw new NotFoundException('Fail update nickname');
    }

    if (profileImgKey) {
      // ✅ S3 존재 검증: 삭제되었거나 만료된 키 방지
      const isExistProfileImgKey = await this.awsService.assertObjectExists(profileImgKey);
      if (!isExistProfileImgKey) throw new NotFoundException('Fail update profileImg');

      const updateUrl = await this.userRepository.updateUserProfileImg(uuid, profileImgKey);
      if (updateUrl.affected == 0) throw new NotFoundException('Fail update profileImg');
    }
  }

  async deleteUser(uuid: string, withdrawalReasonDTO: WithdrawalReasonDTO) {
    const user = await this.userRepository.findUserByUUID(uuid);
    if (!user) throw new NotFoundException('Not Found User');

    await this.userTransactionsRepository.deleteUser(user, withdrawalReasonDTO);
  }

  async findUserNickName(nickNameDTO: ValidateNickNameDTO): Promise<boolean> {
    const { nickName } = nickNameDTO;
    return !!(await this.userRepository.findUserByNickName(nickName));
  }

  async findUserShopSubmissions(pageNation: PaginationQueryDTO, uuid: string) {
    const { page, limit } = pageNation;
    const totalCount = await this.submitRepository.findUserShopSubmitRecord(uuid);
    const rows: ShopSubmitRecord[] = await this.submitRepository.findUserShopSubmitRecordByPageNation(uuid, page, limit);

    const mapped: UserSubmitRecordItemDTO[] = rows.map((record) => new UserSubmitRecordItemDTO(record));
    const pageInfo = new PageInfoDTO(page, limit, totalCount);

    return new UserSubmitRecordDTO(mapped, pageInfo);
  }

  async findUserReviews(reviewPageNation: ReviewPaginationDTO, uuid: string) {
    const { sort, page, limit } = reviewPageNation;
    const totalCount = await this.reviewRepository.findUserReviewByUUID(uuid);
    const reviews = await this.reviewRepository.findUserReviewByPageNation(uuid, page, limit, sort);

    // ✅ Promise.all로 비동기 map 처리
    const rows: UserReviewsRecordItemDTO[] = await Promise.all(
      reviews.map(async (review) => {
        const images = await Promise.all(
          (review.images ?? []).map(async (img) => ({
            id: img.id,
            fileKey: img.fileKey,
            url: await this.awsService.getPresignedGetUrlByKey(img.fileKey),
          })),
        );

        return {
          id: review.id,
          createdAt: review.createdAt,
          content: review.content,
          shop: {
            id: review.shop.id,
            name: review.shop.name,
            mainImage: review.shop.mainImage,
          },
          images,
        };
      }),
    );

    const pageInfo = new PageInfoDTO(page, limit, totalCount);
    return new UserReviewsRecordDTO(rows, pageInfo);
  }

  async getUserFavorites(wishlistPageNation: UserFavoritePageNationDTO, uuid: string) {
    const { page, limit, areaId } = wishlistPageNation;

    const totalCount = await this.userFavoriteRepository.findUserFavoritesCountByUUID(uuid, areaId);
    const rows = await this.userFavoriteRepository.findUserFavoritesByPageNation(uuid, page, limit, areaId);

    const mapped = rows.map((r) => new UserFavoriteRecordItemDTO(r));
    const pageInfo = new PageInfoDTO(page, limit, totalCount);
    return new UserFavoriteRecordDTO(mapped, pageInfo);
  }

  async addUserFavorite(userFavoriteDto: UserFavoriteRequestsDto, uuid: string) {
    const { shopId } = userFavoriteDto;

    const shop = await this.shopRepository.findOnlyShopByShopId(shopId);
    if (!shop) throw new NotFoundException('Not Found Shop');

    const userFavorite = await this.userFavoriteRepository.findUserFavoriteByShopIdAndUUID(shopId, uuid);
    if (userFavorite) return await this.userFavoriteRepository.deleteUserFavoriteByUserFavoritesId(userFavorite.id);

    return await this.userFavoriteRepository.addUserFavoriteByShopIdAndUUID(shopId, uuid);
  }

  async getUserRecentSearches(uuid: string) {
    if (!uuid) return [];
    const result = await this.recentSearchRepository.findRecentSearchListByUUID(uuid);
    return RecentSearchResponsesDto.fromEntities(result);
  }

  async deleteAllRecentSearch(uuid: string) {
    await this.recentSearchRepository.deleteAllRecentSearch(uuid);
  }

  async deleteRecentSearchById(uuid: string, recentSearchId: number) {
    await this.recentSearchRepository.deleteRecentSearch(uuid, recentSearchId);
  }

  async deleteUserShopSubmission(submitId: number, uuid: string): Promise<void> {
    const submitRecord = await this.submitRepository.findSubmitRecordById(submitId, uuid);
    if (!submitRecord) throw new NotFoundException('Not found Submission');

    switch (submitRecord.type) {
      case SubmitType.NewShop:
        await this.shopSubmitTransactionsRepository.deleteShopSubmission(submitRecord.shop.id);
        break;
      case SubmitType.NewOperating:
        await this.shopSubmitTransactionsRepository.deleteOperatingHoursSubmission(submitId, submitRecord.shopOperatingHour.id);
        break;
      case SubmitType.NewProduct:
        await this.shopSubmitTransactionsRepository.deleteProductSubmission(submitRecord.shop.id, uuid);
        break;
      default:
        throw new NotFoundException('Invalid submit type');
    }
  }
}
