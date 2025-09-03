import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { Image } from '../../database/entity/image.entity';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ReviewService {
  constructor(
    private reviewRepository: ReviewRepository,
    private awsService: AwsService,
  ) {}

  async findShopReviewsByShopId(shopId: number, uuid: string) {
    const reviews = await this.reviewRepository.findShopReviewsByShopId(shopId);

    const getPresignedOrNull = async (key?: string | null) => {
      if (!key) return null;
      return this.awsService.getPresignedGetUrlByKey(key);
    };

    const transformImages = async (images: Image[] = []) => {
      return Promise.all(
        images
          .filter((img) => !!img)
          .map(async (image) => {
            const url = await getPresignedOrNull(image.fileKey);
            return { ...image, url };
          }),
      );
    };

    // uuid는 필터링용으로만 유지
    const transformReview = async (review: any) => {
      const images = await transformImages(review.images ?? []);
      const profileImg = await getPresignedOrNull(review.user?.profileImg);

      return {
        ...review,
        images,
        user: review.user
          ? {
              uuid: review.user.uuid, // 👉 필터링 전까진 유지
              profileImg,
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
