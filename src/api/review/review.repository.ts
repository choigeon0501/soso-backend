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
        .createQueryBuilder('review')
        .innerJoin('review.user', 'u') // user.uuid 필터용 조인
        .leftJoinAndSelect('review.shop', 'shop') // 가게 정보
        .leftJoinAndSelect('review.images', 'image') // ✅ 이미지 ManyToMany 조인
        .where('u.uuid = :uuid', { uuid }) // 사용자 조건
        .orderBy('review.createdAt', sort) // 정렬
        .skip(limit * (page - 1))
        .take(limit)
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
