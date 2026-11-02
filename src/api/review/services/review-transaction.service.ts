import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AwsService } from '../../../common/aws/aws.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { Review } from '../entities/review.entity';
import { ReviewImage } from '../entities/review-image.entity';

@Injectable()
export class ReviewTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly awsService: AwsService,
    private readonly loggerService: LoggerService,
  ) {}

  async createReview(uuid: string, shopId: number, content: string, imageUrls: string[]): Promise<void> {
    await this.runInTransaction('createReview', async (manager) => {
      const reviewRepository = manager.getRepository(Review);
      const reviewImageRepository = manager.getRepository(ReviewImage);

      const review = await reviewRepository.save({ content, user: { uuid }, shop: { id: shopId } });

      if (imageUrls.length > 0) {
        review.images = await Promise.all(imageUrls.map((fileKey) => reviewImageRepository.save({ fileKey })));
        await reviewRepository.save(review);
      }
    });
  }

  /**
   * 이미지 삭제는 S3 → 조인 테이블(review_image_mappings) → review_images 순서다. 매핑이 남아 있으면 이미지 행을 지울 수 없다.
   */
  async updateReview(uuid: string, reviewId: number, content: string | undefined, deleteImageIds: number[] | undefined, newImageUrls: string[]): Promise<void> {
    await this.runInTransaction('updateReview', async (manager) => {
      const reviewRepository = manager.getRepository(Review);
      const reviewImageRepository = manager.getRepository(ReviewImage);

      const review = await reviewRepository.findOne({ where: { id: reviewId, user: { uuid } }, relations: ['images'] });
      if (!review) {
        throw new NotFoundException('No Found Review');
      }

      if (deleteImageIds?.length > 0) {
        const imagesToDelete = review.images.filter((image) => deleteImageIds.includes(image.id));
        for (const image of imagesToDelete) {
          await this.awsService.deleteImageFromS3(image.fileKey);
        }
        review.images = review.images.filter((image) => !deleteImageIds.includes(image.id));
        await reviewRepository.save(review);
        await reviewImageRepository.delete(deleteImageIds);
      }

      if (newImageUrls.length > 0) {
        const newImages = await Promise.all(newImageUrls.map((fileKey) => reviewImageRepository.save({ fileKey })));
        review.images = [...review.images, ...newImages];
      }

      if (content) {
        review.content = content;
      }

      await reviewRepository.save(review);
    });
  }

  async deleteReview(uuid: string, reviewId: number): Promise<void> {
    await this.runInTransaction('deleteReview', async (manager) => {
      const reviewRepository = manager.getRepository(Review);

      const review = await reviewRepository.findOne({ where: { id: reviewId, user: { uuid } }, relations: ['images'] });
      if (!review) {
        throw new NotFoundException('Not Found ReviewId');
      }

      if (review.images.length > 0) {
        const imageIds = review.images.map((image) => image.id);
        for (const image of review.images) {
          await this.awsService.deleteImageFromS3(image.fileKey);
        }
        review.images = [];
        await reviewRepository.save(review);
        await manager.getRepository(ReviewImage).delete(imageIds);
      }

      await reviewRepository.remove(review);
    });
  }

  private async runInTransaction(name: string, work: (manager: EntityManager) => Promise<void>): Promise<void> {
    try {
      await this.dataSource.transaction(work);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.loggerService.logError(`ReviewTransaction/ ${name} Error`, err);
      throw new InternalServerErrorException();
    }
  }
}
