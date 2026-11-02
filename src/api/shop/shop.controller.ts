import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, getSchemaPath, ApiExtraModels, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ShopService } from './shop.service';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { GetUUID } from '../../common/decorators/get-uuid.decorator';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { GetSearchPageShopDTO, GetShopWithin1KmDTO } from './dto/query/pagination.dto';
import { SubmitNewProductsDto, SubmitNewShopDto, SubmitShopOperatingHoursDto } from './dto/requests/submit_shop_requests.dto';
import { PostReviewDto, UpdateReviewDto } from './dto/requests/review_request.dto';
import { ShopDetailResponseDTO, ShopSearchPageNationResultDTO, ShopWithin1KmResponseItemDTO } from './dto/responses/shop_response.dto';
import { ReviewReportDto, ShopReportDto } from './dto/requests/report_request';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Shops')
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('/')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '1km 반경 내 소품샵 조회',
    description: '사용자 위치 기준 1km 반경 내의 소품샵들을 조회합니다. 거리순 또는 인기순으로 정렬할 수 있습니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, ShopWithin1KmResponseItemDTO)
  @ApiOkResponse({
    description: '소품샵 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: {
              type: 'array',
              items: { $ref: getSchemaPath(ShopWithin1KmResponseItemDTO) },
            },
          },
        },
      ],
    },
  })
  getShopWithin1Km(@Query() getShopWithin1KmDTO: GetShopWithin1KmDTO, @GetUUID() uuid: string) {
    return this.shopService.findShopsWithin1Km(getShopWithin1KmDTO, uuid);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '새로운 소품샵 제보' })
  @ApiOkResponse({ description: '새로운 소품샵 제보 성공', type: SuccessNoResultResponseDTO })
  submitNewShop(@Body() newShopData: SubmitNewShopDto, @GetUUID() uuid: string) {
    return this.shopService.createNewShop(newShopData, uuid);
  }

  @Get('/search')
  @ApiOperation({
    summary: '키워드로 소품샵 검색',
    description: '키워드를 사용하여 소품샵을 검색합니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, ShopSearchPageNationResultDTO)
  @ApiOkResponse({
    description: '검색 결과 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: {
              $ref: getSchemaPath(ShopSearchPageNationResultDTO),
            },
          },
        },
      ],
    },
  })
  getSearchPageShop(@Query() getSearchPageShopDTO: GetSearchPageShopDTO) {
    return this.shopService.findShopsByKeyword(getSearchPageShopDTO);
  }

  @Get('/:shopId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '소품샵 상세 정보 조회', description: '특정 소품샵의 상세 정보를 조회합니다.' })
  @ApiExtraModels(SuccessResponseDTO, ShopDetailResponseDTO)
  @ApiOkResponse({
    description: '소품샵 상세 정보 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: { result: { $ref: getSchemaPath(ShopDetailResponseDTO) } },
        },
      ],
    },
  })
  getShopByShopId(@Param('shopId', ParseIntPipe) shopId: number, @GetUUID() uuid: string) {
    return this.shopService.findShopByShopId(shopId, uuid);
  }

  @Post('/:shopId/operating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '소품샵 운영정보 제보' })
  @ApiOkResponse({ description: '운영정보 제보 성공', type: SuccessNoResultResponseDTO })
  submitShopOperatingHours(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() operatingData: SubmitShopOperatingHoursDto,
    @GetUUID() uuid: string,
  ) {
    return this.shopService.validateAndUpdateOperatingHours(shopId, operatingData, uuid);
  }

  @Post('/:shopId/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '소품샵 판매 목록 제보' })
  @ApiOkResponse({ description: '판매 목록 제보 성공', type: SuccessNoResultResponseDTO })
  submitProducts(@Param('shopId', ParseIntPipe) shopId: number, @Body() products: SubmitNewProductsDto, @GetUUID() uuid: string) {
    return this.shopService.validateAndUpdateProducts(shopId, products, uuid);
  }

  @Post('/:shopId/reviews')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('reviewImages', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 최대 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) cb(null, true);
        else cb(new Error('Only images allowed!'), false);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '리뷰 작성', description: '리뷰를 작성합니다.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          example: '리뷰 작성 내용',
        },
        reviewImages: {
          type: 'array',
          nullable: true,
          items: {
            type: 'string',
            format: 'binary',
            example: '업데이트할 리뷰 이미지',
          },
        },
      },
    },
  })
  @ApiOkResponse({ description: '리뷰 작성 성공', type: SuccessNoResultResponseDTO })
  createReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() postReviewDto: PostReviewDto,
    @GetUUID() uuid: string,
    @UploadedFiles() reviewImages?: Express.Multer.File[],
  ) {
    return this.shopService.createReview(uuid, postReviewDto, shopId, reviewImages);
  }

  @Patch('/:shopId/reviews/:reviewId')
  @UseInterceptors(
    FilesInterceptor('newReviewImages', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 최대 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) cb(null, true);
        else cb(new Error('Only images allowed!'), false);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '리뷰 수정', description: '리뷰를 수정합니다.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [],
      properties: {
        content: {
          type: 'string',
          nullable: true,
          example: '리뷰 작성 내용',
        },
        newReviewImages: {
          type: 'array',
          nullable: true,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        deleteReviewImages: {
          type: 'array',
          nullable: true,
          items: {
            type: 'number',
            example: 1,
          },
        },
      },
    },
  })
  @ApiOkResponse({ description: '리뷰 수정 성공', type: SuccessNoResultResponseDTO })
  updateReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUUID() uuid: string,
    @UploadedFiles() newReviewImages?: Express.Multer.File[],
  ) {
    return this.shopService.updateReview(uuid, updateReviewDto, shopId, reviewId, newReviewImages);
  }

  @Delete('/:shopId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '리뷰 삭제', description: '리뷰를 삭제합니다.' })
  @ApiOkResponse({ description: '리뷰 삭제 성공', type: SuccessNoResultResponseDTO })
  deleteReview(@Param('shopId', ParseIntPipe) shopId: number, @Param('reviewId', ParseIntPipe) reviewId: number, @GetUUID() uuid: string) {
    return this.shopService.deleteReviewByUUID(uuid, shopId, reviewId);
  }

  @Post('/:shopId/shop/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '소품샵 신고',
    description: 'status => 0: 더 이상 운영하지 않은 가게 / 1: 위치가 잘못됨 ',
  })
  @ApiOkResponse({ description: '소품샵 신고 성공', type: SuccessNoResultResponseDTO })
  shopReport(@Param('shopId', ParseIntPipe) shopId: number, @GetUUID() uuid: string, @Body() shopReportDto: ShopReportDto) {
    return this.shopService.reportShop(uuid, shopReportDto, shopId);
  }

  @Post('/:shopId/reviews/:reviewId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '리뷰 신고',
    description:
      'status => 0: 관련 없는 후기 / 1: 음란, 욕설 등 부적절한 내용 / 2: 개인정보 노출 / 3: 홍보 및 광고 후기 / 4: 같은 내용 도배 / 5: 기타 ',
  })
  @ApiOkResponse({ description: '리뷰 신고 성공', type: SuccessNoResultResponseDTO })
  reviewReport(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @GetUUID() uuid: string,
    @Body() reviewReportDto: ReviewReportDto,
  ) {
    return this.shopService.reportReview(uuid, reviewReportDto, shopId, reviewId);
  }
}
