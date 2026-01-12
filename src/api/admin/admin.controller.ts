import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AdminJwtAuthGuard } from '../../common/admin-jwt/admin-jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetAllUsersResponseDto } from './dto/response/get-all-users-response.dto';
import { GetAllShopReportResponseDto } from './dto/response/get-all-shop-report-response.dto';
import { GetAllReviewReportResponseDto } from './dto/response/get-all-review-report-response.dto';
import { GetAllSubmissionsForAdminResponseDto } from './dto/response/get-all-submission-response.dto';
import { ToggleShopHiddenDto } from './dto/request/toggle-shop-hidden.dto';
import { ToggleReviewHiddenDto } from './dto/request/toggle-review-hidden.dto';
import { RejectProductSubmissionDto } from './dto/request/reject-product-submission.dto';
import { GetAllFeedbacksResponseDto } from './dto/response/get-all-feedbacks-response.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary: '관리자 로그인',
    description: '관리자 계정으로 로그인하여 JWT 토큰을 발급합니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    example: '토큰',
  })
  @Post('login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return await this.adminService.adminLogin(adminLoginDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '전체 사용자 조회 (Admin)',
    description: '활동 중인 사용자 및 탈퇴한 사용자 목록을 조회합니다.',
  })
  @ApiOkResponse({
    type: GetAllUsersResponseDto,
  })
  @UseGuards(AdminJwtAuthGuard)
  @Get('users')
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '소품샵 신고 목록 조회 (Admin)',
    description: '누적 신고 횟수 기준으로 소품샵 신고 목록을 조회합니다.',
  })
  @ApiOkResponse({
    type: GetAllShopReportResponseDto,
    isArray: true,
  })
  @UseGuards(AdminJwtAuthGuard)
  @Get('shop-reports')
  async getAllShopReports() {
    return await this.adminService.getAllShopReports();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '리뷰 신고 목록 조회 (Admin)',
    description: '누적 신고 횟수 기준으로 리뷰 신고 목록을 조회합니다.',
  })
  @ApiOkResponse({
    type: GetAllReviewReportResponseDto,
    isArray: true,
  })
  @UseGuards(AdminJwtAuthGuard)
  @Get('review-reports')
  async getAllReviewReports() {
    return await this.adminService.getAllReviewReports();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '전체 Submission 조회 (Admin)',
    description: '신규 소품샵 / 상품 / 운영시간 등록 요청(Submission)을 모두 조회합니다.',
  })
  @ApiOkResponse({
    type: GetAllSubmissionsForAdminResponseDto,
  })
  @UseGuards(AdminJwtAuthGuard)
  @Get('submission')
  async getAllPendingSubmissions() {
    return await this.adminService.getAllPendingSubmissions();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '전체 Feedback 조회 (Admin)',
    description: '사용자가 작성한 피드백을 모두 조회합니다.',
  })
  @ApiOkResponse({
    type: GetAllFeedbacksResponseDto,
    isArray: true,
  })
  @UseGuards(AdminJwtAuthGuard)
  @Get('feedback')
  async getAllFeedbacks() {
    return await this.adminService.getAllFeedbacks();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 제보 승인',
    description: '관리자가 상품 제보를 승인하여 실제 운영 데이터로 반영합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/product/accept')
  async acceptProductSubmission(@Param('submissionId') submissionId: number) {
    return await this.adminService.acceptProductSubmission(submissionId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 제보 반려',
    description: '관리자가 상품 제보를 반려하고 반려 사유를 저장합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/product/reject')
  async rejectProductSubmission(@Param('submissionId') submissionId: number, @Body() rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.adminService.rejectProductSubmission(submissionId, rejectProductSubmissionDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '운영정보 제보 승인',
    description: '관리자가 운영정보 제보를 승인하여 실제 운영 데이터로 반영합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/operating-info/accept')
  async acceptOperatingInfoSubmission(@Param('submissionId') submissionId: number) {
    return await this.adminService.acceptOperatingInfoSubmission(submissionId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '운영정보 제보 반려',
    description: '관리자가 운영정보 제보를 반려하고 반려 사유를 저장합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/operating-info/reject')
  async rejectOperatingInfoSubmission(@Param('submissionId') submissionId: number, @Body() rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.adminService.rejectOperatingInfoSubmission(submissionId, rejectProductSubmissionDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '새로운 소품샵 제보 승인',
    description: '관리자가 새로운 소품샵 제보를 승인하여 실제 운영 데이터로 반영합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/new-shop/accept')
  async acceptNewShopSubmission(@Param('submissionId') submissionId: number) {
    return await this.adminService.acceptNewShopSubmission(submissionId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '새로운 소품샵 제보 반려',
    description: '관리자가 새로운 소품샵 제보를 반려하고 반려 사유를 저장합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('submission/:submissionId/new-shop/reject')
  async rejectNewShopSubmission(@Param('submissionId') submissionId: number, @Body() rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.adminService.rejectNewShopSubmission(submissionId, rejectProductSubmissionDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '소품샵 숨김/해제 (Admin)',
    description: '관리자가 소품샵을 유저에게 숨기거나 다시 노출합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('shops/:shopId/hidden')
  async toggleShopHidden(@Param('shopId') shopId: number, @Body() toggleShopHiddenDto: ToggleShopHiddenDto) {
    return await this.adminService.toggleShopHidden(shopId, toggleShopHiddenDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '리뷰 숨김/해제 (Admin)',
    description: '관리자가 리뷰를 숨기거나 다시 노출합니다.',
  })
  @UseGuards(AdminJwtAuthGuard)
  @Patch('reviews/:reviewId/hidden')
  async toggleReviewHidden(@Param('reviewId') reviewId: number, @Body() toggleReviewHiddenDto: ToggleReviewHiddenDto): Promise<void> {
    return await this.adminService.toggleReviewHidden(reviewId, toggleReviewHiddenDto);
  }
}
