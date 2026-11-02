import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UserService } from '../user/services/user.service';
import { ShopService } from '../shop/services/shop.service';
import { ShopSubmitService } from '../shop/services/shop-submit.service';
import { ReviewService } from '../review/services/review.service';
import { FeedbackService } from '../feedback/feedback.service';
import { AdminJwtAuthGuard } from '../../common/admin-jwt/admin-jwt-auth.guard';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { GetUsersQueryDto } from '../user/dto/query/get-users-query.dto';
import { ActivityUserResponseDto, WithdrawalUserResponseDto } from '../user/dto/response/get-all-users-response.dto';
import { GetSubmissionsQueryDto } from '../shop/dto/query/get-submissions-query.dto';
import { RejectSubmissionDto } from '../shop/dto/request/reject-submission.dto';
import { ToggleShopHiddenDto } from '../shop/dto/request/toggle-shop-hidden.dto';
import { GetAllShopReportResponseDto } from '../shop/dto/response/get-all-shop-report-response.dto';
import {
  NewOperatingSubmissionResponseDto,
  NewProductSubmissionResponseDto,
  NewShopSubmissionResponseDto,
} from '../shop/dto/response/get-all-submission-response.dto';
import { ToggleReviewHiddenDto } from '../review/dto/request/toggle-review-hidden.dto';
import { GetAllReviewReportResponseDto } from '../review/dto/response/get-all-review-report-response.dto';
import { GetAllFeedbacksResponseDto } from '../feedback/dto/response/get-all-feedbacks-response.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    private readonly shopService: ShopService,
    private readonly shopSubmitService: ShopSubmitService,
    private readonly reviewService: ReviewService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @ApiOperation({ summary: '관리자 로그인 API', description: '관리자 계정으로 로그인하여 JWT 토큰을 발급합니다.' })
  @ApiOkResponse({ description: '로그인 성공', example: '토큰' })
  @Post('login')
  adminLogin(@Body() body: AdminLoginDto) {
    return this.adminService.adminLogin(body);
  }

  @ApiOperation({
    summary: '전체 사용자 조회 API',
    description:
      'active=true: 회원 목록(ActivityUserResponseDto[]), active=false: 탈퇴 목록(WithdrawalUserResponseDto[]). ' +
      'sortBy=created|lastActiveAt, order=desc|asc 로 정렬 가능.',
  })
  @ApiExtraModels(ActivityUserResponseDto, WithdrawalUserResponseDto)
  @ApiOkResponse({
    description: 'active=true 시 ActivityUserResponseDto[], active=false 시 WithdrawalUserResponseDto[]',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: getSchemaPath(ActivityUserResponseDto) } },
        { type: 'array', items: { $ref: getSchemaPath(WithdrawalUserResponseDto) } },
      ],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('users')
  getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.findAllUsersForAdmin(query);
  }

  @ApiOperation({ summary: '소품샵 신고 목록 조회 API', description: '누적 신고 횟수 기준으로 소품샵 신고 목록을 조회합니다.' })
  @ApiOkResponse({ type: GetAllShopReportResponseDto, isArray: true })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('shop-reports')
  getAllShopReports() {
    return this.shopService.findAllShopReportsForAdmin();
  }

  @ApiOperation({ summary: '리뷰 신고 목록 조회 API', description: '누적 신고 횟수 기준으로 리뷰 신고 목록을 조회합니다.' })
  @ApiOkResponse({ type: GetAllReviewReportResponseDto, isArray: true })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('review-reports')
  getAllReviewReports() {
    return this.reviewService.findAllReviewReportsForAdmin();
  }

  @ApiOperation({
    summary: '전체 Submission 조회 API',
    description:
      'type=shop: 신규 소품샵, type=operate: 운영정보 수정, type=product: 판매정보 수정. ' +
      'status=pending|approved 로 처리 상태 필터(거절 제외). sortBy=created, order=desc|asc 로 정렬.',
  })
  @ApiExtraModels(NewShopSubmissionResponseDto, NewOperatingSubmissionResponseDto, NewProductSubmissionResponseDto)
  @ApiOkResponse({
    description: 'type에 따라 NewShopSubmissionResponseDto[] | NewOperatingSubmissionResponseDto[] | NewProductSubmissionResponseDto[]',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: getSchemaPath(NewShopSubmissionResponseDto) } },
        { type: 'array', items: { $ref: getSchemaPath(NewOperatingSubmissionResponseDto) } },
        { type: 'array', items: { $ref: getSchemaPath(NewProductSubmissionResponseDto) } },
      ],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('submission')
  getAllSubmissions(@Query() query: GetSubmissionsQueryDto) {
    return this.shopSubmitService.findSubmissionsForAdmin(query);
  }

  @ApiOperation({ summary: '전체 Feedback 조회 API', description: '사용자가 작성한 피드백을 모두 조회합니다.' })
  @ApiOkResponse({ type: GetAllFeedbacksResponseDto, isArray: true })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('feedback')
  getAllFeedbacks() {
    return this.feedbackService.findAllFeedbacksForAdmin();
  }

  @ApiOperation({ summary: '상품 제보 승인 API', description: '관리자가 상품 제보를 승인하여 실제 운영 데이터로 반영합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/product/accept')
  acceptProductSubmission(@Param('submissionId', ParseIntPipe) submissionId: number) {
    return this.shopSubmitService.acceptProductSubmission(submissionId);
  }

  @ApiOperation({ summary: '상품 제보 반려 API', description: '관리자가 상품 제보를 반려하고 반려 사유를 저장합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/product/reject')
  rejectProductSubmission(@Param('submissionId', ParseIntPipe) submissionId: number, @Body() body: RejectSubmissionDto) {
    return this.shopSubmitService.rejectProductSubmission(submissionId, body);
  }

  @ApiOperation({ summary: '운영정보 제보 승인 API', description: '관리자가 운영정보 제보를 승인하여 실제 운영 데이터로 반영합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/operating-info/accept')
  acceptOperatingInfoSubmission(@Param('submissionId', ParseIntPipe) submissionId: number) {
    return this.shopSubmitService.acceptOperatingInfoSubmission(submissionId);
  }

  @ApiOperation({ summary: '운영정보 제보 반려 API', description: '관리자가 운영정보 제보를 반려하고 반려 사유를 저장합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/operating-info/reject')
  rejectOperatingInfoSubmission(@Param('submissionId', ParseIntPipe) submissionId: number, @Body() body: RejectSubmissionDto) {
    return this.shopSubmitService.rejectOperatingInfoSubmission(submissionId, body);
  }

  @ApiOperation({ summary: '새로운 소품샵 제보 승인 API', description: '관리자가 새로운 소품샵 제보를 승인하여 실제 운영 데이터로 반영합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/new-shop/accept')
  acceptNewShopSubmission(@Param('submissionId', ParseIntPipe) submissionId: number) {
    return this.shopSubmitService.acceptNewShopSubmission(submissionId);
  }

  @ApiOperation({ summary: '새로운 소품샵 제보 반려 API', description: '관리자가 새로운 소품샵 제보를 반려하고 반려 사유를 저장합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/new-shop/reject')
  rejectNewShopSubmission(@Param('submissionId', ParseIntPipe) submissionId: number, @Body() body: RejectSubmissionDto) {
    return this.shopSubmitService.rejectNewShopSubmission(submissionId, body);
  }

  @ApiOperation({ summary: '소품샵 숨김/해제 API', description: '관리자가 소품샵을 유저에게 숨기거나 다시 노출합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('shops/:shopId/hidden')
  toggleShopHidden(@Param('shopId', ParseIntPipe) shopId: number, @Body() body: ToggleShopHiddenDto) {
    return this.shopService.toggleShopHidden(shopId, body);
  }

  @ApiOperation({ summary: '리뷰 숨김/해제 API', description: '관리자가 리뷰를 숨기거나 다시 노출합니다.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('reviews/:reviewId/hidden')
  toggleReviewHidden(@Param('reviewId', ParseIntPipe) reviewId: number, @Body() body: ToggleReviewHiddenDto) {
    return this.reviewService.toggleReviewHidden(reviewId, body);
  }
}
