import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from 'src/database/entity/review.entity';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { SortOrder } from '../../common/enum/sorting.enum';

export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private readonly loggerService: LoggerService,
  ) {}
  async findOneReviewById(reviewId: number) {
    try {
      return await this.reviewRepository.findOne({ where: { id: reviewId } });
    } catch (err) {
      this.loggerService.warn(`Review/ createReview Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserReviewByUUID(uuid: string) {
    try {
      return await this.reviewRepository.createQueryBuilder('review').where('review.user.uuid = :uuid', { uuid }).getCount();
    } catch (err) {
      this.loggerService.warn(`Review/ findUserReviewByUUID Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserReviewByPageNation(uuid: string, page: number, limit: number, sort: SortOrder) {
    try {
      return await this.reviewRepository
        .createQueryBuilder('review') // ✅ 엔티티 별칭 수정
        .where('review.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
        .leftJoinAndSelect('review.shop', 'shop') // ✅ shop 관계 조인
        .leftJoinAndSelect('review.imageMappings', 'rim') // 매핑 엔티티
        .leftJoinAndSelect('rim.image', 'image') // 실제 이미지
        .orderBy('review.createdAt', sort) // ✅ createdAt 기준 내림차순 정렬 (최신순)
        .skip(limit * (page - 1)) // ✅ offset 설정
        .take(limit) // ✅ limit 설정
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Review/ findUserReviewByPageNation Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findShopReviewsByShopId(shopId: number) {
    try {
      return await this.reviewRepository.find({
        where: {
          shop: {
            id: shopId,
          },
        },
        relations: ['images', 'user'],
        order: {
          createdAt: 'DESC', // 최신순
        },
      });
    } catch (err) {
      this.loggerService.warn(`Review/ findShopReviewsByShopId Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
