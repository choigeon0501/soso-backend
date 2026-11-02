import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UserService } from './services/user.service';
import { UserFavoriteService } from './services/user-favorite.service';
import { ShopSubmitService } from '../shop/services/shop-submit.service';
import { RecentSearchService } from '../shop/services/recent-search.service';
import { ReviewService } from '../review/services/review.service';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import { GetUUID } from '../../common/decorators/get-uuid.decorator';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { PageInfoDto } from '../../common/dto/page-info.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UpdateUserProfileDto } from './dto/request/update-user-profile.dto';
import { ToggleUserFavoriteDto } from './dto/request/toggle-user-favorite.dto';
import { WithdrawUserQueryDto } from './dto/query/withdraw-user-query.dto';
import { CheckNicknameQueryDto } from './dto/query/check-nickname-query.dto';
import { GetUserFavoritesQueryDto } from './dto/query/get-user-favorites-query.dto';
import { GetUserProfileResponseDto } from './dto/response/get-user-profile-response.dto';
import { GetUserFavoritesResponseDto, UserFavoriteItemResponseDto } from './dto/response/get-user-favorites-response.dto';
import { GetMySubmissionsResponseDto, MySubmissionItemResponseDto } from '../shop/dto/response/get-my-submissions-response.dto';
import { GetRecentSearchResponseDto } from '../shop/dto/response/get-recent-search-response.dto';
import { GetMyReviewsQueryDto } from '../review/dto/query/get-my-reviews-query.dto';
import { GetMyReviewsResponseDto, MyReviewItemResponseDto } from '../review/dto/response/get-my-reviews-response.dto';
import { PROFILE_IMAGE_MAX_SIZE, PROFILE_IMAGE_TYPE } from './const/profile-image.const';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userFavoriteService: UserFavoriteService,
    private readonly shopSubmitService: ShopSubmitService,
    private readonly recentSearchService: RecentSearchService,
    private readonly reviewService: ReviewService,
  ) {}

  @ApiOperation({
    summary: '프로필 정보 불러오기 API',
    description: 'isNew: 닉네임 작성 완료 여부 (false면 닉네임 설정 페이지로 이동 필요)',
  })
  @ApiExtraModels(SuccessResponseDTO, GetUserProfileResponseDto)
  @ApiOkResponse({
    description: '프로필 정보 불러오기 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetUserProfileResponseDto) } } }] },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  getUserProfile(@GetUUID() uuid: string) {
    return this.userService.getUserProfile(uuid);
  }

  @ApiOperation({ summary: '프로필 정보 수정하기 API', description: '프로필 사진(옵션), 닉네임(옵션)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [],
      properties: {
        nickName: { type: 'string', nullable: true, example: '소소한유저' },
        profileImage: { type: 'string', nullable: true, format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ description: '프로필 정보 수정 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  @Patch('/me')
  updateUserProfile(
    @Body() body: UpdateUserProfileDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: PROFILE_IMAGE_MAX_SIZE }), new FileTypeValidator({ fileType: PROFILE_IMAGE_TYPE })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File | undefined,
    @GetUUID() uuid: string,
  ) {
    return this.userService.updateUserProfile(body, file, uuid);
  }

  @ApiOperation({ summary: '회원탈퇴 API' })
  @ApiOkResponse({ description: '회원탈퇴 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('/me')
  withdrawUser(@Query() query: WithdrawUserQueryDto, @GetUUID() uuid: string) {
    return this.userService.withdrawUser(query, uuid);
  }

  @ApiOperation({ summary: '닉네임 중복 체크 API', description: 'true: 중복됨 / false: 중복되지 않음' })
  @ApiOkResponse({
    description: '닉네임 중복 체크 결과',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { type: 'boolean', enum: [true, false] } } }] },
  })
  @Get('/duplicate-check')
  getNickNameDuplicate(@Query() query: CheckNicknameQueryDto) {
    return this.userService.existsNickName(query);
  }

  @ApiOperation({ summary: '사용자가 등록/제안한 소품샵 정보 API' })
  @ApiExtraModels(GetMySubmissionsResponseDto, MySubmissionItemResponseDto, PageInfoDto)
  @ApiOkResponse({
    description: '사용자가 등록/제안한 소품샵 정보 조회 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetMySubmissionsResponseDto) } } }] },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('/me/shop-submissions')
  getMySubmissions(@Query() query: PaginationQueryDto, @GetUUID() uuid: string) {
    return this.shopSubmitService.findMySubmissions(query, uuid);
  }

  @ApiOperation({ summary: '제보한 데이터 제거 API' })
  @ApiOkResponse({ description: '제보한 데이터 제거 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('/me/shop-submissions/:submitId')
  deleteMySubmission(@Param('submitId', ParseIntPipe) submitId: number, @GetUUID() uuid: string) {
    return this.shopSubmitService.deleteMySubmission(submitId, uuid);
  }

  @ApiOperation({ summary: '사용자가 등록한 리뷰 정보 API' })
  @ApiExtraModels(GetMyReviewsResponseDto, MyReviewItemResponseDto, PageInfoDto)
  @ApiOkResponse({
    description: '사용자가 등록한 리뷰 조회 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetMyReviewsResponseDto) } } }] },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('/me/reviews')
  getMyReviews(@Query() query: GetMyReviewsQueryDto, @GetUUID() uuid: string) {
    return this.reviewService.findMyReviews(query, uuid);
  }

  @ApiOperation({ summary: '사용자가 찜한 소품샵 리스트 API' })
  @ApiExtraModels(GetUserFavoritesResponseDto, UserFavoriteItemResponseDto, PageInfoDto)
  @ApiOkResponse({
    description: '찜한 소품샵 리스트 조회 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetUserFavoritesResponseDto) } } }] },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('/me/favorite')
  getUserFavorites(@Query() query: GetUserFavoritesQueryDto, @GetUUID() uuid: string) {
    return this.userFavoriteService.findMyFavorites(query, uuid);
  }

  @ApiOperation({ summary: '소품샵 찜하기 API', description: '찜하기 리스트에 해당 소품샵을 넣습니다.' })
  @ApiOkResponse({ description: '찜하기 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/me/favorite')
  toggleUserFavorite(@Body() body: ToggleUserFavoriteDto, @GetUUID() uuid: string) {
    return this.userFavoriteService.toggleFavorite(body, uuid);
  }

  @ApiOperation({ summary: '최근 검색 기록 조회 API', description: '로그인된 경우 최근 검색한 소품샵 리스트를 반환합니다.' })
  @ApiExtraModels(SuccessResponseDTO, GetRecentSearchResponseDto)
  @ApiOkResponse({
    description: '최근 검색 기록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        { properties: { result: { type: 'array', items: { $ref: getSchemaPath(GetRecentSearchResponseDto) } } } },
      ],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalAuthGuard)
  @Get('/me/recent-searches')
  getRecentSearches(@GetUUID() uuid: string) {
    return this.recentSearchService.findMyRecentSearches(uuid);
  }

  @ApiOperation({ summary: '최근 검색 기록 전체 삭제 API' })
  @ApiOkResponse({ description: '최근 검색 기록 전체 삭제 완료', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('/me/recent-searches')
  deleteAllRecentSearches(@GetUUID() uuid: string) {
    return this.recentSearchService.deleteAllRecentSearches(uuid);
  }

  @ApiOperation({ summary: '최근 검색 기록 삭제 API', description: '최근 검색 기록 id로 삭제' })
  @ApiOkResponse({ description: '최근 검색 기록 삭제 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('/me/recent-searches/:recentSearchId')
  deleteRecentSearch(@Param('recentSearchId', ParseIntPipe) recentSearchId: number, @GetUUID() uuid: string) {
    return this.recentSearchService.deleteRecentSearch(recentSearchId, uuid);
  }
}
