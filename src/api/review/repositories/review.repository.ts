import { InjectRepository } from '@nestjs/typeorm';
import { Review } from 'src/api/review/entities/review.entity';
import { Repository } from 'typeorm';
import { SortOrder } from '../../../common/enum/sorting.enum';

export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}
  async findOneReviewById(reviewId: number) {
    return await this.reviewRepository.findOne({
      where: {
        id: reviewId,
        isHidden: false,
      },
    });
  }

  async findByIdForHiddenReview(reviewId: number) {
    return await this.reviewRepository.findOne({
      where: {
        id: reviewId,
      },
    });
  }

  async findUserReviewByUUID(uuid: string) {
    return await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.user.uuid = :uuid', { uuid })
      .andWhere('review.isHidden = false')
      .getCount();
  }

  async findUserReviewByPageNation(uuid: string, page: number, limit: number, sort: SortOrder) {
    return await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.user', 'u') // user.uuid 필터용 조인
      .leftJoinAndSelect('review.shop', 'shop') // 가게 정보
      .leftJoinAndSelect('review.images', 'image') // ✅ 이미지 ManyToMany 조인
      .where('u.uuid = :uuid', { uuid }) // 사용자 조건
      .andWhere('review.isHidden = false')
      .orderBy('review.createdAt', sort) // 정렬
      .skip(limit * (page - 1))
      .take(limit)
      .getMany();
  }

  async findShopReviewsByShopId(shopId: number) {
    return await this.reviewRepository.find({
      where: {
        shop: {
          id: shopId,
        },
        isHidden: false,
      },
      relations: ['images', 'user'],
      order: {
        createdAt: 'DESC', // 최신순
      },
    });
  }

  async saveReview(review: Review) {
    return await this.reviewRepository.save(review);
  }
}
