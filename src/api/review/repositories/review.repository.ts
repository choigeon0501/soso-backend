import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { SortOrder } from '../../../common/const/sort-order.const';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async findVisibleById(reviewId: number): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { id: reviewId, isHidden: false } });
  }

  async findById(reviewId: number): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { id: reviewId } });
  }

  async countVisibleByUuid(uuid: string): Promise<number> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .where('review.user.uuid = :uuid', { uuid })
      .andWhere('review.isHidden = false')
      .getCount();
  }

  async findVisibleByUuidWithShopAndImages(uuid: string, page: number, limit: number, sort: SortOrder): Promise<Review[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.user', 'u')
      .leftJoinAndSelect('review.shop', 'shop')
      .leftJoinAndSelect('review.images', 'image')
      .where('u.uuid = :uuid', { uuid })
      .andWhere('review.isHidden = false')
      .orderBy('review.createdAt', sort)
      .skip(limit * (page - 1))
      .take(limit)
      .getMany();
  }

  async findVisibleByShopIdWithImagesAndUser(shopId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { shop: { id: shopId }, isHidden: false },
      relations: ['images', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async save(review: Review): Promise<Review> {
    return this.reviewRepository.save(review);
  }
}
