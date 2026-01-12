import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ShopService } from '../shop/shop.service';
import * as bcrypt from 'bcrypt';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { AdminLoginDto } from './dto/request/admin-login.dto';
import { AuthTokenService } from '../auth/services/auth-token.service';
import { GetAllUsersResponseDto } from './dto/response/get-all-users-response.dto';
import { GetAllShopReportResponseDto } from './dto/response/get-all-shop-report-response.dto';
import { GetAllReviewReportResponseDto } from './dto/response/get-all-review-report-response.dto';
import { GetAllSubmissionsForAdminResponseDto } from './dto/response/get-all-submission-response.dto';
import { ToggleShopHiddenDto } from './dto/request/toggle-shop-hidden.dto';
import { ToggleReviewHiddenDto } from './dto/request/toggle-review-hidden.dto';
import { ReviewService } from '../review/review.service';
import { RejectProductSubmissionDto } from './dto/request/reject-product-submission.dto';
import { FeedbackService } from '../feedback/feedback.service';
import { GetAllFeedbacksResponseDto } from './dto/response/get-all-feedbacks-response.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly shopService: ShopService,
    private readonly reviewService: ReviewService,
    private readonly authTokenService: AuthTokenService,
    private readonly feedbackService: FeedbackService,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const { email, password } = adminLoginDto;

    const admin = await this.adminUserRepository.findByEmail(email);
    if (!admin) {
      throw new ForbiddenException();
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new ForbiddenException();
    }

    await this.adminUserRepository.updateLastLogin(admin.id);

    return this.authTokenService.issueAdminToken(admin.id);
  }

  async getAllUsers(): Promise<GetAllUsersResponseDto> {
    return await this.userService.getAllUsersForAdmin();
  }

  async getAllShopReports(): Promise<GetAllShopReportResponseDto[]> {
    return await this.shopService.getAllShopReportsForAdmin();
  }

  async getAllReviewReports(): Promise<GetAllReviewReportResponseDto[]> {
    return await this.shopService.getAllReviewReportsForAdmin();
  }

  async getAllPendingSubmissions(): Promise<GetAllSubmissionsForAdminResponseDto> {
    return await this.shopService.getAllPendingSubmissions();
  }

  async getAllFeedbacks(): Promise<GetAllFeedbacksResponseDto[]> {
    return await this.feedbackService.getAllFeedbacks();
  }

  async acceptProductSubmission(submissionId: number) {
    return await this.shopService.acceptProductSubmission(submissionId);
  }

  async rejectProductSubmission(submissionId: number, rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.shopService.rejectProductSubmission(submissionId, rejectProductSubmissionDto.rejectMessage);
  }

  async acceptOperatingInfoSubmission(submissionId: number) {
    return await this.shopService.acceptOperatingInfoSubmission(submissionId);
  }

  async rejectOperatingInfoSubmission(submissionId: number, rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.shopService.rejectOperatingInfoSubmission(submissionId, rejectProductSubmissionDto.rejectMessage);
  }

  async acceptNewShopSubmission(submissionId: number) {
    return await this.shopService.acceptNewShopSubmission(submissionId);
  }

  async rejectNewShopSubmission(submissionId: number, rejectProductSubmissionDto: RejectProductSubmissionDto) {
    return await this.shopService.rejectNewShopSubmission(submissionId, rejectProductSubmissionDto.rejectMessage);
  }

  async toggleShopHidden(shopId: number, toggleShopHiddenDto: ToggleShopHiddenDto): Promise<void> {
    const { isHidden } = toggleShopHiddenDto;

    return await this.shopService.toggleShopHidden(shopId, isHidden);
  }

  async toggleReviewHidden(reviewId: number, toggleReviewHiddenDto: ToggleReviewHiddenDto): Promise<void> {
    const { isHidden } = toggleReviewHiddenDto;

    await this.reviewService.toggleReviewHidden(reviewId, isHidden);
  }
}
