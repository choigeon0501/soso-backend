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

    // 이미지 presigned URL 변환
    const transformImages = async (images: Image[]) => {
      return Promise.all(
        images.map(async (image) => {
          const presignedUrl = await this.awsService.getPresignedGetUrlByKey(image.file_key);
          return {
            ...image,
            url: presignedUrl,
          };
        }),
      );
    };

    // 각 리뷰에 대해 images 변환 적용
    const reviewsWithPresignedUrls = await Promise.all(
      reviews.map(async (review) => ({
        ...review,
        images: await transformImages(review.images || []),
      })),
    );

    const userReviews = reviewsWithPresignedUrls.filter((review) => review.user?.uuid === uuid);
    const otherReviews = reviewsWithPresignedUrls.filter((review) => review.user == null || review.user?.uuid !== uuid);

    return {
      userReviews,
      otherReviews,
    };
  }
}
