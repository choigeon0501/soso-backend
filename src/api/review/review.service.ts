import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewImage } from './entities/review-image.entity';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) {}

  async toggleReviewHidden(reviewId: number, isHidden: boolean): Promise<void> {
    const review = await this.reviewRepository.findByIdForHiddenReview(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    review.isHidden = isHidden;

    await this.reviewRepository.saveReview(review);
  }

  async findShopReviewsByShopId(shopId: number, uuid: string) {
    const reviews = await this.reviewRepository.findShopReviewsByShopId(shopId);

    const transformImages = async (reviewImages: ReviewImage[] = []) => {
      return Promise.all(
        reviewImages
          .filter((img) => !!img)
          .map(async (image) => {
            const url = image.fileKey;
            return { ...image, url };
          }),
      );
    };

    // uuid는 필터링용으로만 유지
    const transformReview = async (review: any) => {
      const images = await transformImages(review.images ?? []);

      return {
        ...review,
        images,
        user: review.user
          ? {
              uuid: review.user.uuid, // 👉 필터링 전까진 유지
              profileImg: review.user.profileImg ?? null,
              nickName: review.user.nickName ?? null,
            }
          : null,
      };
    };

    const reviewsWithPresigned = await Promise.all(reviews.map(transformReview));

    // uuid 포함 상태에서 필터링
    const userReviewsRaw = reviewsWithPresigned.filter((r) => r.user?.uuid === uuid);
    const otherReviewsRaw = reviewsWithPresigned.filter((r) => !r.user || r.user.uuid !== uuid);

    // 이제 uuid 제거
    const stripUuid = (reviews: any[]) =>
      reviews.map((r) => ({
        ...r,
        user: r.user
          ? {
              profileImg: r.user.profileImg,
              nickName: r.user.nickName,
            }
          : null,
      }));

    return {
      userReviews: stripUuid(userReviewsRaw),
      otherReviews: stripUuid(otherReviewsRaw),
    };
  }
}
