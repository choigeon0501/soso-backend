import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ShopService } from './services/shop.service';
import { ShopSubmitService } from './services/shop-submit.service';
import { ReviewService } from '../review/services/review.service';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import { GetUUID } from '../../common/decorators/get-uuid.decorator';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { GetNearbyShopsQueryDto } from './dto/query/get-nearby-shops-query.dto';
import { SearchShopsQueryDto } from './dto/query/search-shops-query.dto';
import { SubmitNewShopDto } from './dto/request/submit-new-shop.dto';
import { SubmitShopOperatingHoursDto } from './dto/request/submit-shop-operating-hours.dto';
import { SubmitNewProductsDto } from './dto/request/submit-new-products.dto';
import { ReportShopDto } from './dto/request/report-shop.dto';
import { GetNearbyShopResponseDto } from './dto/response/get-nearby-shop-response.dto';
import { SearchShopsResponseDto } from './dto/response/search-shops-response.dto';
import { GetShopDetailResponseDto } from './dto/response/get-shop-detail-response.dto';
import { CreateReviewDto } from '../review/dto/request/create-review.dto';
import { UpdateReviewDto } from '../review/dto/request/update-review.dto';
import { ReportReviewDto } from '../review/dto/request/report-review.dto';
import { REVIEW_IMAGE_UPLOAD_OPTIONS } from '../review/const/review-image.const';

@ApiTags('Shops')
@Controller('shops')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly shopSubmitService: ShopSubmitService,
    private readonly reviewService: ReviewService,
  ) {}

  @ApiOperation({
    summary: '1km 반경 내 소품샵 조회 API',
    description: '사용자 위치 기준 1km 반경 내의 소품샵들을 조회합니다. 거리순 또는 인기순으로 정렬할 수 있습니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, GetNearbyShopResponseDto)
  @ApiOkResponse({
    description: '소품샵 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        { properties: { result: { type: 'array', items: { $ref: getSchemaPath(GetNearbyShopResponseDto) } } } },
      ],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalAuthGuard)
  @Get('/')
  getNearbyShops(@Query() query: GetNearbyShopsQueryDto, @GetUUID() uuid: string) {
    return this.shopService.findNearbyShops(query, uuid);
  }

  @ApiOperation({ summary: '새로운 소품샵 제보 API' })
  @ApiOkResponse({ description: '새로운 소품샵 제보 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/')
  submitNewShop(@Body() body: SubmitNewShopDto, @GetUUID() uuid: string) {
    return this.shopSubmitService.submitNewShop(body, uuid);
  }

  @ApiOperation({ summary: '키워드로 소품샵 검색 API', description: '키워드를 사용하여 소품샵을 검색합니다.' })
  @ApiExtraModels(SuccessResponseDTO, SearchShopsResponseDto)
  @ApiOkResponse({
    description: '검색 결과 조회 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(SearchShopsResponseDto) } } }] },
  })
  @Get('/search')
  getSearchShops(@Query() query: SearchShopsQueryDto) {
    return this.shopService.searchShops(query);
  }

  @ApiOperation({ summary: '소품샵 상세 정보 조회 API', description: '특정 소품샵의 상세 정보를 조회합니다.' })
  @ApiExtraModels(SuccessResponseDTO, GetShopDetailResponseDto)
  @ApiOkResponse({
    description: '소품샵 상세 정보 조회 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetShopDetailResponseDto) } } }] },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalAuthGuard)
  @Get('/:shopId')
  getShopDetail(@Param('shopId', ParseIntPipe) shopId: number, @GetUUID() uuid: string) {
    return this.shopService.getShopDetail(shopId, uuid);
  }

  @ApiOperation({ summary: '소품샵 운영정보 제보 API' })
  @ApiOkResponse({ description: '운영정보 제보 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/:shopId/operating')
  submitOperatingHours(@Param('shopId', ParseIntPipe) shopId: number, @Body() body: SubmitShopOperatingHoursDto, @GetUUID() uuid: string) {
    return this.shopSubmitService.submitOperatingHours(shopId, body, uuid);
  }

  @ApiOperation({ summary: '소품샵 판매 목록 제보 API' })
  @ApiOkResponse({ description: '판매 목록 제보 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/:shopId/products')
  submitProducts(@Param('shopId', ParseIntPipe) shopId: number, @Body() body: SubmitNewProductsDto, @GetUUID() uuid: string) {
    return this.shopSubmitService.submitProducts(shopId, body, uuid);
  }

  @ApiOperation({ summary: '리뷰 작성 API', description: '리뷰를 작성합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string', example: '리뷰 작성 내용' },
        reviewImages: { type: 'array', nullable: true, items: { type: 'string', format: 'binary', example: '업데이트할 리뷰 이미지' } },
      },
    },
  })
  @ApiOkResponse({ description: '리뷰 작성 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('reviewImages', 10, REVIEW_IMAGE_UPLOAD_OPTIONS))
  @Post('/:shopId/reviews')
  createReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() body: CreateReviewDto,
    @UploadedFiles() reviewImages: Express.Multer.File[] | undefined,
    @GetUUID() uuid: string,
  ) {
    return this.reviewService.createReview(shopId, body, reviewImages, uuid);
  }

  @ApiOperation({ summary: '리뷰 수정 API', description: '리뷰를 수정합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [],
      properties: {
        content: { type: 'string', nullable: true, example: '리뷰 작성 내용' },
        newReviewImages: { type: 'array', nullable: true, items: { type: 'string', format: 'binary' } },
        deleteReviewImages: { type: 'array', nullable: true, items: { type: 'number', example: 1 } },
      },
    },
  })
  @ApiOkResponse({ description: '리뷰 수정 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('newReviewImages', 10, REVIEW_IMAGE_UPLOAD_OPTIONS))
  @Patch('/:shopId/reviews/:reviewId')
  updateReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() body: UpdateReviewDto,
    @UploadedFiles() newReviewImages: Express.Multer.File[] | undefined,
    @GetUUID() uuid: string,
  ) {
    return this.reviewService.updateReview(shopId, reviewId, body, newReviewImages, uuid);
  }

  @ApiOperation({ summary: '리뷰 삭제 API', description: '리뷰를 삭제합니다.' })
  @ApiOkResponse({ description: '리뷰 삭제 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('/:shopId/reviews/:reviewId')
  deleteReview(@Param('shopId', ParseIntPipe) shopId: number, @Param('reviewId', ParseIntPipe) reviewId: number, @GetUUID() uuid: string) {
    return this.reviewService.deleteReview(shopId, reviewId, uuid);
  }

  @ApiOperation({ summary: '소품샵 신고 API', description: 'status => 0: 더 이상 운영하지 않은 가게 / 1: 위치가 잘못됨 ' })
  @ApiOkResponse({ description: '소품샵 신고 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/:shopId/shop/report')
  reportShop(@Param('shopId', ParseIntPipe) shopId: number, @Body() body: ReportShopDto, @GetUUID() uuid: string) {
    return this.shopService.reportShop(shopId, body, uuid);
  }

  @ApiOperation({
    summary: '리뷰 신고 API',
    description:
      'status => 0: 관련 없는 후기 / 1: 음란, 욕설 등 부적절한 내용 / 2: 개인정보 노출 / 3: 홍보 및 광고 후기 / 4: 같은 내용 도배 / 5: 기타 ',
  })
  @ApiOkResponse({ description: '리뷰 신고 성공', type: SuccessNoResultResponseDTO })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('/:shopId/reviews/:reviewId/report')
  reportReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() body: ReportReviewDto,
    @GetUUID() uuid: string,
  ) {
    return this.reviewService.reportReview(shopId, reviewId, body, uuid);
  }
}
