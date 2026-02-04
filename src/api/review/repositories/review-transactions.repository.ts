import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { Review } from '../entities/review.entity';
import { ReviewImage } from '../entities/review-image.entity';
import { AwsService } from '../../../common/aws/aws.service';

@Injectable()
export class ReviewTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private loggerService: LoggerService,
    private awsService: AwsService,
  ) {}

  async createReview(uuid: string, shopId: number, content: string, reviewImagesUrl: string[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reviewRepo = queryRunner.manager.getRepository(Review);
      const reviewImgRepo = queryRunner.manager.getRepository(ReviewImage);

      // Review 생성
      const review = await reviewRepo.save({
        content,
        user: { uuid },
        shop: { id: shopId },
      });

      // 이미지가 존재할 경우에만 처리
      if (reviewImagesUrl?.length > 0) {
        // Review와 Image 연결
        review.images = await Promise.all(
          reviewImagesUrl.map(async (key) => {
            const [image] = await Promise.all([reviewImgRepo.save({ fileKey: key })]);
            return image;
          }),
        );
        await reviewRepo.save(review);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Review/ CreateReview Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async updateReview(uuid: string, reviewId: number, content?: string, deleteImages?: number[], newImageKeys?: string[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reviewRepo = queryRunner.manager.getRepository(Review);
      const reviewImgRepo = queryRunner.manager.getRepository(ReviewImage);

      // Review 찾기
      const review = await reviewRepo.findOne({
        where: { id: reviewId, user: { uuid } },
        relations: ['images'],
      });

      if (!review) {
        throw new NotFoundException('No Found Review');
      }

      // 제거할 이미지가 존재하면 삭제
      if (deleteImages?.length > 0) {
        // S3에서 이미지 삭제
        const imagesToDelete = review.images.filter((image) => deleteImages.includes(image.id));
        for (const image of imagesToDelete) {
          await this.awsService.deleteImageFromS3(image.fileKey);
        }
        // 먼저 조인 테이블(review_image_mappings)에서 매핑 제거
        review.images = review.images.filter((image) => !deleteImages.includes(image.id));
        await reviewRepo.save(review);
        // 그 다음 review_images 테이블에서 이미지 삭제
        await reviewImgRepo.delete(deleteImages);
      }

      // 새 이미지가 존재하면 추가
      if (newImageKeys?.length > 0) {
        const newImages = await Promise.all(
          newImageKeys.map(async (fileKey) => {
            return await reviewImgRepo.save({ fileKey });
          }),
        );
        review.images = [...review.images, ...newImages];
      }

      // 리뷰 내용 업데이트
      if (content) {
        review.content = content;
      }

      await reviewRepo.save(review);
      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Review/ UpdateReview Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteReview(uuid: string, reviewId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reviewRepo = queryRunner.manager.getRepository(Review);
      const reviewImgRepo = queryRunner.manager.getRepository(ReviewImage);

      // Review 찾기
      const review = await reviewRepo.findOne({
        where: { id: reviewId, user: { uuid } },
        relations: ['images'],
      });

      if (!review) {
        throw new NotFoundException('Not Found ReviewId');
      }

      // 이미지가 존재하면 S3와 DB에서 삭제
      if (review.images.length > 0) {
        // 이미지 ID를 먼저 저장
        const imageIds = review.images.map((image) => image.id);

        // S3에서 이미지 삭제
        for (const image of review.images) {
          await this.awsService.deleteImageFromS3(image.fileKey);
        }

        // 먼저 조인 테이블(review_image_mappings)에서 매핑 삭제
        review.images = [];
        await reviewRepo.save(review);

        // 그 다음 review_images 테이블에서 이미지 삭제
        await reviewImgRepo.delete(imageIds);
      }

      // 리뷰 삭제
      await reviewRepo.remove(review);

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Review/ DeleteReview Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
