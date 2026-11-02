import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ReviewBan } from '../entities/review-ban.entity';

@Injectable()
export class ReviewBanRepository {
  constructor(
    @InjectRepository(ReviewBan)
    private readonly reviewBanRepository: Repository<ReviewBan>,
  ) {}

  async existsActiveByUuid(uuid: string, now: Date): Promise<boolean> {
    return this.reviewBanRepository.exists({
      where: { user: { uuid }, banStartAt: LessThanOrEqual(now), banEndAt: MoreThanOrEqual(now) },
    });
  }
}
