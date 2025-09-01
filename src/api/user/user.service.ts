import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AwsService } from '../aws/aws.service';
import { ReviewRepository } from '../review/review.repository';
import { SubmitRepository } from '../submit/submit.repository';
import { UserFavoriteRepository } from '../user-favorite/user-favorite.repository';

import { ValidateNickNameDTO, WithdrawalReasonDTO } from './dto/query/user.dto';
import { PaginationQueryDTO } from './dto/query/pagination.dto';
import { ProfileImagePresignedDTO, UpdateProfileDTO } from './dto/requests/user_requests.dto';

import { PreSignedURLResponsesDTO, PresignedUserProfileImgResponsesDTO, UserProfileResponsesDTO } from './dto/responses/user_responses.dto';
import { PageInfoDTO } from './dto/responses/pagination_responses.dto';
import { UserSubmitRecordDTO, UserSubmitRecordItemDTO } from './dto/responses/submit_responses.dto';
import { UserReviewsRecordDTO, UserReviewsRecordItemDTO } from './dto/responses/review_responses.dto';
import { Recent_search_responsesDto } from './dto/responses/recent_search_responses.dto';

import { SubmitUserRecord } from '../../database/entity/submit-user-record.entity';
import { DeleteUserTransactionsRepository } from '../transactions/delete-user.repository';
import { RecentSearchRepository } from '../recent-search/recent-search.repository';
import { SubmitType } from '../../common/enum/role.enum';
import { SubmitTransactionsRepository } from '../transactions/submit.repository';
import { ShopRepository } from '../shop/shop.repository';
import { UserFavoriteRequestsDto } from './dto/requests/wishlist_requests.dto';
import { ReviewPaginationDTO } from './dto/query/review.dto';
import { UserWithdrawalRepository } from '../user-withdrawal/user-withdrawal.repository';
import { UserFavoritePageNationDTO } from './dto/query/wishlist.dto';
import { UserFavoriteRecordDTO } from './dto/responses/user_favorite_responses.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private awsService: AwsService,
    private reviewRepository: ReviewRepository,
    private userFavoriteRepository: UserFavoriteRepository,
    private submitRepository: SubmitRepository,
    private recentSearchRepository: RecentSearchRepository,
    private deleteUserTransactionsRepository: DeleteUserTransactionsRepository,
    private submitTransactionsRepository: SubmitTransactionsRepository,
    private shopRepository: ShopRepository,
    private userWithdrawalRepository: UserWithdrawalRepository,
  ) {}

  async getUserProfile(uuid: string): Promise<UserProfileResponsesDTO> {
    const user = await this.userRepository.findUserByUUID(uuid);
    if (!user) throw new NotFoundException('Not Found User');

    // PresignedURL 발급
    user.profileImg = user.profileImg ? await this.awsService.getPresignedGetUrlByKey(user.profileImg) : null;

    return new UserProfileResponsesDTO(user);
  }

  async updateUserProfile(updateProfileDTO: UpdateProfileDTO, uuid: string) {
    const { nickName, profileImgKey } = updateProfileDTO;

    if (nickName) {
      const existNickName = await this.userRepository.findUserByNickName(nickName);
      if (existNickName) throw new ConflictException('Nickname already exists.');

      const newNickName = await this.userRepository.updateNickName(uuid, nickName);
      if (newNickName.affected == 0) throw new NotFoundException('Fail update nickname');
    }

    if (profileImgKey) {
      // ✅ S3 존재 검증: 삭제되었거나 만료된 키 방지
      const isExistImg = await this.awsService.assertObjectExists(profileImgKey);
      if (!isExistImg) throw new NotFoundException('Not Found Image');

      const updateUrl = await this.userRepository.updateUserProfileImg(uuid, profileImgKey);
      if (updateUrl.affected == 0) throw new NotFoundException('Fail update profileImg');
    }
  }

  async createUserProfileImgPresignedURL(profileImagePresignedDTO: ProfileImagePresignedDTO) {
    const { originalName, contentType } = profileImagePresignedDTO;
    const result = await this.awsService.getPresignedPutUrl(originalName, contentType);

    return new PreSignedURLResponsesDTO(result);
  }

  async getPresignedURLUserProfileImg(uuid: string) {
    const expirseIn = 300;
    const user = await this.userRepository.findUserByUUID(uuid);
    if (!user) throw new NotFoundException('Not Found User');

    // ✅ S3 존재 검증: 삭제되었거나 만료된 키 방지
    await this.awsService.assertObjectExists(user.profileImg);

    const userProfilePresignedURL = await this.awsService.getPresignedGetUrlByKey(user.profileImg, expirseIn);
    return new PresignedUserProfileImgResponsesDTO(userProfilePresignedURL, expirseIn);
  }

  async deleteUser(uuid: string, withdrawalReasonDTO: WithdrawalReasonDTO) {
    const user = await this.userRepository.findUserByUUID(uuid);
    if (!user) throw new NotFoundException('Not Found User');

    await this.deleteUserTransactionsRepository.deleteUser(user, withdrawalReasonDTO);
  }

  async findUserNickName(nickNameDTO: ValidateNickNameDTO): Promise<boolean> {
    const { nickName } = nickNameDTO;
    return !!(await this.userRepository.findUserByNickName(nickName));
  }

  async findUserShopSubmissions(pageNation: PaginationQueryDTO, uuid: string) {
    const { page, limit } = pageNation;
    const totalCount = await this.submitRepository.findUserSubmitUserRecord(uuid);
    const rows: SubmitUserRecord[] = await this.submitRepository.findUserSubmitUserRecordByPageNation(uuid, page, limit);

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
        const mainImageUrl = review.shop.mainImage ? await this.awsService.getPresignedGetUrlByKey(review.shop.mainImage) : null;

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
            mainImage: mainImageUrl,
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

    const totalCount = await this.userFavoriteRepository.findUserWishlistByUUID(uuid, areaId);
    const rows = await this.userFavoriteRepository.findUserFavoritesByPageNation(uuid, page, limit, areaId);

    const pageInfo = new PageInfoDTO(page, limit, totalCount);
    return new UserFavoriteRecordDTO(rows, pageInfo);
  }

  async addUserFavorite(userFavoriteDto: UserFavoriteRequestsDto, uuid: string) {
    const { shopId } = userFavoriteDto;

    const shop = await this.shopRepository.findShopByShopId(shopId);
    if (!shop) throw new NotFoundException('Not Found Shop');

    const userFavorite = await this.userFavoriteRepository.findUserFavoriteByShopIdAndUUID(shopId, uuid);
    if (userFavorite) return await this.userFavoriteRepository.deleteUserFavoriteByUserFavoritesId(userFavorite.id);

    return await this.userFavoriteRepository.addUserFavoriteByShopIdAndUUID(shopId, uuid);
  }

  async getUserRecentSearches(uuid: string) {
    if (!uuid) return [];
    const result = await this.recentSearchRepository.findRecentSearchListByUUID(uuid);
    return Recent_search_responsesDto.fromEntities(result);
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
        await this.submitTransactionsRepository.deleteShopSubmission(submitRecord.shop.id);
        break;
      case SubmitType.NewOperating:
        await this.submitTransactionsRepository.deleteOperatingHoursSubmission(submitId, submitRecord.shopOperatingHour.id);
        break;
      case SubmitType.NewProduct:
        await this.submitTransactionsRepository.deleteProductSubmission(submitRecord.shop.id, uuid);
        break;
      default:
        throw new NotFoundException('Invalid submit type');
    }
  }
}
