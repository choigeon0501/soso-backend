import { Body, Controller, Get, Param, Post, Patch, UseGuards, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UserService } from './user.service';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from 'src/common/response/response.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { OptionalAuthGuard } from '../../common/gurad/optional-auth-guard.guard';
import { GetUUID } from '../../common/deco/get-user.deco';
import { ProfileImagePresignedDTO, UpdateProfileDTO } from './dto/requests/user_requests.dto';
import { WithdrawalReasonDTO, ValidateNickNameDTO } from './dto/query/user.dto';
import { PaginationQueryDTO } from './dto/query/pagination.dto';
import { PageInfoDTO, PaginationResponsesDto } from './dto/responses/pagination_responses.dto';
import { PreSignedURLResponsesDTO, PresignedUserProfileImgResponsesDTO, UserProfileResponsesDTO } from './dto/responses/user_responses.dto';
import { Recent_search_responsesDto } from './dto/responses/recent_search_responses.dto';
import { UserSubmitRecordDTO, UserSubmitRecordItemDTO } from './dto/responses/submit_responses.dto';
import { UserReviewsRecordDTO, UserReviewsRecordItemDTO } from './dto/responses/review_responses.dto';
import { ReviewPaginationDTO } from './dto/query/review.dto';
import { UserFavoritePageNationDTO } from './dto/query/wishlist.dto';
import { UserFavoriteRequestsDto } from './dto/requests/wishlist_requests.dto';
import { UserFavoriteRecordDTO, UserFavoriteRecordItemDTO } from './dto/responses/user_favorite_responses.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '프로필 정보 불러오기',
    description: 'isNew: 닉네임 작성 완료 여부 (false면 닉네임 설정 페이지로 이동 필요)',
  })
  @ApiExtraModels(SuccessResponseDTO, UserProfileResponsesDTO)
  @ApiOkResponse({
    description: '프로필 정보 불러오기 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UserProfileResponsesDTO) } } }],
    },
  })
  async getUserProfile(@GetUUID() uuid: string) {
    return new SuccessResponseDTO(await this.userService.getUserProfile(uuid));
  }

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '프로필 정보 수정하기', description: '프로필 사진(옵션), 닉네임(옵션)' })
  @ApiOkResponse({ description: '프로필 정보 수정 성공', type: SuccessNoResultResponseDTO })
  async updateProfile(@GetUUID() uuid: string, @Body() updateProfileDTO?: UpdateProfileDTO) {
    await this.userService.updateUserProfile(updateProfileDTO, uuid);
    return new SuccessNoResultResponseDTO();
  }

  @Post('/me/presigned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiExtraModels(SuccessResponseDTO, PreSignedURLResponsesDTO)
  @ApiOperation({
    summary: '유저 프로필 이미지 등록 - presigend',
    description: 'return 받은 URL을 PUT 메서드로 클라이언트에서 이미지를 등록시키면 됨',
  })
  @ApiOkResponse({
    description: 'Presigned URL 발급 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(PreSignedURLResponsesDTO) } } }],
    },
  })
  async createUserProfileImgPresignedURL(@Body() profileImagePresignedDTO: ProfileImagePresignedDTO) {
    return new SuccessResponseDTO(await this.userService.createUserProfileImgPresignedURL(profileImagePresignedDTO));
  }

  @Get('/me/presigned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiExtraModels(SuccessResponseDTO, PresignedUserProfileImgResponsesDTO)
  @ApiOperation({
    summary: '유저 프로필 이미지 불러오기 - presigend',
    description: 'ExpriseIn을 참고해서 지날 때마다 호출해야 됨',
  })
  @ApiOkResponse({
    description: 'Presigned URL 발급 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(PresignedUserProfileImgResponsesDTO) } } }],
    },
  })
  async getPresignedURLUserProfileImg(@GetUUID() uuid: string) {
    return new SuccessResponseDTO(await this.userService.getPresignedURLUserProfileImg(uuid));
  }

  @Delete('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '회원탈퇴' })
  @ApiOkResponse({ description: '회원탈퇴 성공', type: SuccessNoResultResponseDTO })
  async deleteUser(@Query() withdrawalReasonDTO: WithdrawalReasonDTO, @GetUUID() uuid: string) {
    await this.userService.deleteUser(uuid, withdrawalReasonDTO);
    return new SuccessNoResultResponseDTO();
  }

  @Get('/duplicate-check')
  @ApiOperation({ summary: '닉네임 중복 체크', description: 'true: 중복됨 / false: 중복되지 않음' })
  @ApiOkResponse({
    description: '닉네임 중복 체크 결과',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { type: 'boolean', enum: [true, false] } } }],
    },
  })
  async validateNickName(@Query() validationNickNameDTO: ValidateNickNameDTO) {
    return new SuccessResponseDTO(await this.userService.findUserNickName(validationNickNameDTO));
  }

  @Get('/me/shop-submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '사용자가 등록/제안한 소품샵 정보' })
  @ApiExtraModels(UserSubmitRecordDTO, UserSubmitRecordItemDTO, PageInfoDTO, PaginationResponsesDto)
  @ApiOkResponse({
    description: '사용자가 등록/제안한 소품샵 정보 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UserSubmitRecordDTO) } } }],
    },
  })
  async getUserShopSubmissions(@GetUUID() uuid: string, @Query() pageNation: PaginationQueryDTO) {
    return new SuccessResponseDTO(await this.userService.findUserShopSubmissions(pageNation as any, uuid));
  }

  @Delete('/me/shop-submissions/:submitId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '제보한 데이터 제거' })
  @ApiOkResponse({ description: '제보한 데이터 제거 성공', type: SuccessNoResultResponseDTO })
  async deleteUserShopSubmission(@Param('submitId', ParseIntPipe) submitId: number, @GetUUID() uuid: string) {
    await this.userService.deleteUserShopSubmission(submitId, uuid);
    return new SuccessNoResultResponseDTO();
  }

  @Get('/me/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '사용자가 등록한 리뷰 정보' })
  @ApiExtraModels(UserReviewsRecordDTO, UserReviewsRecordItemDTO, PageInfoDTO, PaginationResponsesDto)
  @ApiOkResponse({
    description: '사용자가 등록한 리뷰 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UserReviewsRecordDTO) } } }],
    },
  })
  async getUserReviews(@GetUUID() uuid: string, @Query() reviewPageNation: ReviewPaginationDTO) {
    return new SuccessResponseDTO(await this.userService.findUserReviews(reviewPageNation, uuid));
  }

  @Get('/me/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '사용자가 찜한 소품샵 리스트' })
  @ApiExtraModels(UserFavoriteRecordDTO, UserFavoriteRecordItemDTO, PageInfoDTO, PaginationResponsesDto)
  @ApiOkResponse({
    description: '찜한 소품샵 리스트 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UserFavoriteRecordDTO) } } }],
    },
  })
  async getUserFavorites(@GetUUID() uuid: string, @Query() pageNation: UserFavoritePageNationDTO) {
    return new SuccessResponseDTO(await this.userService.getUserFavorites(pageNation as any, uuid));
  }

  @Post('/me/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '소품샵 찜하기', description: '찜하기 리스트에 해당 소품샵을 넣습니다.' })
  @ApiOkResponse({ description: '찜하기 성공', type: SuccessNoResultResponseDTO })
  async addUserFavorite(@GetUUID() uuid: string, @Body() userFavoriteRequestsDto: UserFavoriteRequestsDto) {
    await this.userService.addUserFavorite(userFavoriteRequestsDto, uuid);
    return new SuccessNoResultResponseDTO();
  }

  @Get('/me/recent-searches')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '최근 검색 기록 조회', description: '로그인된 경우 최근 검색한 소품샵 리스트를 반환합니다.' })
  @ApiExtraModels(SuccessResponseDTO, Recent_search_responsesDto)
  @ApiOkResponse({
    description: '최근 검색 기록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        { properties: { result: { type: 'array', items: { $ref: getSchemaPath(Recent_search_responsesDto) } } } },
      ],
    },
  })
  async getUserRecentSearches(@GetUUID() uuid: string) {
    return new SuccessResponseDTO(await this.userService.getUserRecentSearches(uuid));
  }

  @Delete('/me/recent-searches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '최근 검색 기록 전체 삭제' })
  @ApiOkResponse({ description: '최근 검색 기록 전체 삭제 완료', type: SuccessNoResultResponseDTO })
  async deleteAllRecentSearch(@GetUUID() uuid: string) {
    await this.userService.deleteAllRecentSearch(uuid);
    return new SuccessNoResultResponseDTO();
  }

  @Delete('/me/recent-searches/:recentSearchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '최근 검색 기록 삭제', description: '최근 검색 기록 id로 삭제' })
  @ApiOkResponse({ description: '최근 검색 기록 삭제 성공', type: SuccessNoResultResponseDTO })
  async deleteRecentSearchById(@GetUUID() uuid: string, @Param('recentSearchId', ParseIntPipe) recentSearchId: number) {
    await this.userService.deleteRecentSearchById(uuid, recentSearchId);
    return new SuccessNoResultResponseDTO();
  }
}
