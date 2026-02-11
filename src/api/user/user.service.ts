import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { AwsService } from '../../common/aws/aws.service';
import { ReviewRepository } from '../review/repositories/review.repository';
import { ShopSubmitRepository } from '../shop/repositories/shop-submit.repository';
import { UserFavoriteRepository } from './repositories/user-favorite.repository';

import { ValidateNickNameDTO, WithdrawalReasonDTO } from './dto/query/user.dto';
import { PaginationQueryDTO } from './dto/query/pagination.dto';
import { UpdateProfileDTO } from './dto/requests/user_requests.dto';

import { UserProfileResponsesDTO } from './dto/responses/user_responses.dto';
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
import { UserWithdrawalRepository } from './repositories/user-withdrawal.repository';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userWithdrawalRepository: UserWithdrawalRepository,
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

    return new UserProfileResponsesDTO(user, userAuthIdentity.provider);
  }

  async updateUserProfile(updateProfileDTO: UpdateProfileDTO, uuid: string, file?: Express.Multer.File) {
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

    if (file) {
      const [profileImg] = await this.awsService.uploadImagesToS3(file, 'user-profile');
      const user = await this.userRepository.findUserByUUID(uuid);
      await this.awsService.deleteImageFromS3(user.profileImg);
      user.profileImg = profileImg;
      await this.userRepository.saveUser(user);
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

    const rows: UserReviewsRecordItemDTO[] = await Promise.all(
      reviews.map(async (review) => {
        const images = await Promise.all(
          (review.images ?? []).map(async (img) => ({
            id: img.id,
            url: img.fileKey,
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
        await this.shopSubmitTransactionsRepository.deleteShopSubmission(submitId, submitRecord.shop.id);
        break;
      case SubmitType.NewOperating:
        await this.shopSubmitTransactionsRepository.deleteOperatingHoursSubmission(submitId, submitRecord.shopOperatingHour.id);
        break;
      case SubmitType.NewProduct:
        await this.shopSubmitTransactionsRepository.deleteProductSubmission(submitId, submitRecord.shop.id, uuid);
        break;
      default:
        throw new NotFoundException('Invalid submit type');
    }
  }

  async getAllUsersForAdmin() {
    const allActivityUsers = await this.userRepository.findActivityUsers();

    const activityUsers = allActivityUsers.map((user, index) => ({
      num: index + 1, // 1부터 시작
      uuid: user.uuid,
      nickName: user.nickName,
      createdAt: user.createdAt,
      lastActivityAt: user.lastActivityAt,
      provider: user.authIdentities[0].provider,
    }));

    const allWithdrawalUsers = await this.userWithdrawalRepository.findWithdrawalUsers();

    const withdrawalUsers = allWithdrawalUsers.map((user, index) => ({
      num: index + 1, // 1부터 시작
      uuid: user.uuid,
      nickName: user.nickName,
      createdAt: user.createdAt,
      withdrawalReason: user.reasonCode,
    }));

    return { activityUsers, withdrawalUsers };
  }
}
