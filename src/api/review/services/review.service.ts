import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AwsService } from '../../../common/aws/aws.service';
import { ReviewRepository } from '../repositories/review.repository';
import { ReviewBanRepository } from '../repositories/review-ban.repository';
import { ReviewReportRepository } from '../repositories/review-report.repository';
import { ReviewTransactionService } from './review-transaction.service';
import { ShopService } from '../../shop/services/shop.service';
import { CreateReviewDto } from '../dto/request/create-review.dto';
import { UpdateReviewDto } from '../dto/request/update-review.dto';
import { ReportReviewDto } from '../dto/request/report-review.dto';
import { ToggleReviewHiddenDto } from '../dto/request/toggle-review-hidden.dto';
import { GetMyReviewsQueryDto } from '../dto/query/get-my-reviews-query.dto';
import { GetMyReviewsResponseDto } from '../dto/response/get-my-reviews-response.dto';
import { GetAllReviewReportResponseDto } from '../dto/response/get-all-review-report-response.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewBanRepository: ReviewBanRepository,
    private readonly reviewReportRepository: ReviewReportRepository,
    private readonly reviewTransactionService: ReviewTransactionService,
    private readonly awsService: AwsService,
    @Inject(forwardRef(() => ShopService))
    private readonly shopService: ShopService,
  ) {}

  /**
   * 작성자 uuid로 내 리뷰와 다른 사람 리뷰를 나눈 뒤 응답에서는 uuid를 뺀다.
   * 탈퇴로 user가 비어 있는 리뷰는 비로그인 조회(uuid 없음)에서 양쪽 목록에 모두 들어간다.
   */
  async findShopReviews(shopId: number, uuid: string) {
    const reviews = await this.reviewRepository.findVisibleByShopIdWithImagesAndUser(shopId);

    const shapedReviews = reviews.map((review) => ({
      ...review,
      images: (review.images ?? []).filter((image) => !!image).map((image) => ({ ...image, url: image.fileKey })),
      user: review.user
        ? { uuid: review.user.uuid, profileImg: review.user.profileImg ?? null, nickName: review.user.nickName ?? null }
        : null,
    }));
    const withoutUuid = (review: (typeof shapedReviews)[number]) => ({
      ...review,
      user: review.user ? { profileImg: review.user.profileImg, nickName: review.user.nickName } : null,
    });

    return {
      userReviews: shapedReviews.filter((review) => review.user?.uuid === uuid).map(withoutUuid),
      otherReviews: shapedReviews.filter((review) => !review.user || review.user.uuid !== uuid).map(withoutUuid),
    };
  }

  async findMyReviews(query: GetMyReviewsQueryDto, uuid: string): Promise<GetMyReviewsResponseDto> {
    const { sort, page, limit } = query;

    const totalElements = await this.reviewRepository.countVisibleByUuid(uuid);
    const reviews = await this.reviewRepository.findVisibleByUuidWithShopAndImages(uuid, page, limit, sort);

    const totalPages = Math.ceil(totalElements / limit);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        createdAt: review.createdAt,
        content: review.content,
        shop: { id: review.shop.id, name: review.shop.name, mainImage: review.shop.mainImage },
        images: (review.images ?? []).map((image) => ({ id: image.id, url: image.fileKey })),
      })),
      pageInfo: { page, limit, totalElements, totalPages, nextPage: page < totalPages },
    };
  }

  async createReview(shopId: number, body: CreateReviewDto, reviewImages: Express.Multer.File[] | undefined, uuid: string): Promise<void> {
    const shop = await this.shopService.findVisibleShop(shopId);
    if (!shop) {
      throw new NotFoundException('Not Exist Shop');
    }

    const isBanned = await this.reviewBanRepository.existsActiveByUuid(uuid, new Date());
    if (isBanned) {
      throw new ConflictException('Can not post review.');
    }

    const imageUrls = await this.awsService.uploadImagesToS3(reviewImages, 'review');

    await this.reviewTransactionService.createReview(uuid, shopId, body.content, imageUrls);
  }

  async updateReview(
    shopId: number,
    reviewId: number,
    body: UpdateReviewDto,
    newReviewImages: Express.Multer.File[] | undefined,
    uuid: string,
  ): Promise<void> {
    const shop = await this.shopService.findVisibleShop(shopId);
    if (!shop) {
      throw new NotFoundException('Not Exist Shop');
    }

    const isBanned = await this.reviewBanRepository.existsActiveByUuid(uuid, new Date());
    if (isBanned) {
      throw new ConflictException('Can not post review.');
    }

    const newImageUrls = await this.awsService.uploadImagesToS3(newReviewImages, 'review');

    await this.reviewTransactionService.updateReview(uuid, reviewId, body.content, body.deleteReviewImages, newImageUrls);
  }

  async deleteReview(shopId: number, reviewId: number, uuid: string): Promise<void> {
    const shop = await this.shopService.findVisibleShop(shopId);
    if (!shop) {
      throw new ConflictException('Not Exist Shop');
    }

    const review = await this.reviewRepository.findVisibleById(reviewId);
    if (!review) {
      throw new ConflictException('Not Exist Review');
    }

    await this.reviewTransactionService.deleteReview(uuid, reviewId);
  }

  async reportReview(shopId: number, reviewId: number, body: ReportReviewDto, uuid: string): Promise<void> {
    const shop = await this.shopService.findVisibleShop(shopId);
    if (!shop) {
      throw new ConflictException('Not Exist Shop');
    }

    const review = await this.reviewRepository.findVisibleById(reviewId);
    if (!review) {
      throw new NotFoundException('Not exist review');
    }

    const alreadyReported = await this.reviewReportRepository.existsByUuidAndReviewId(uuid, reviewId);
    if (alreadyReported) {
      throw new ConflictException('Exist Report Review');
    }

    await this.reviewReportRepository.create(uuid, reviewId, body);
  }

  /**
   * 신고 한 건이 한 행이고, reportCount는 같은 리뷰의 누적 신고 수다. 누적 수 내림차순으로 정렬한 뒤 번호를 매긴다.
   */
  async findAllReviewReportsForAdmin(): Promise<GetAllReviewReportResponseDto[]> {
    const reviewReports = await this.reviewReportRepository.findAllWithReviewAndUser();

    const reportCountByReviewId: Record<number, number> = {};
    for (const report of reviewReports) {
      reportCountByReviewId[report.review.id] = (reportCountByReviewId[report.review.id] || 0) + 1;
    }
    const reports = reviewReports.map((report) => ({
      reviewId: report.review.id,
      userEmail: report.user.email,
      reportType: report.reportType,
      reportMessage: report.reportMessage,
      reviewContent: report.review.content,
      reportDate: report.createdAt,
      reportCount: reportCountByReviewId[report.review.id],
      isHidden: report.review.isHidden,
    }));
    reports.sort((a, b) => b.reportCount - a.reportCount);

    return reports.map((report, index) => ({ num: index + 1, ...report }));
  }

  async toggleReviewHidden(reviewId: number, body: ToggleReviewHiddenDto): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    review.isHidden = body.isHidden;

    await this.reviewRepository.save(review);
  }
}
