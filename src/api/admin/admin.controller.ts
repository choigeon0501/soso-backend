import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AdminJwtAuthGuard } from '../../common/admin-jwt/admin-jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetAllUsersResponseDto } from './dto/response/get-all-users-response.dto';
import { GetAllShopReportResponseDto } from './dto/response/get-all-shop-report-response.dto';
import { GetAllReviewReportResponseDto } from './dto/response/get-all-review-report-response.dto';
import { GetAllSubmissionsForAdminResponseDto } from './dto/response/get-all-submission-response.dto';

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
  async getAllSubmissions() {
    return await this.adminService.getAllSubmissions();
  }
}
