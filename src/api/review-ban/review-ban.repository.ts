import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ReviewBan } from '../../database/entity/review-ban.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewBanRepository {
  constructor(
    @InjectRepository(ReviewBan)
    private reviewBanRepository: Repository<ReviewBan>,
  ) {}

  async findUserReviewBanByUuid(uuid: string, nowDate: Date = new Date()) {
    return await this.reviewBanRepository.findOne({
      where: {
        user: { uuid: uuid },
        banStartAt: LessThanOrEqual(nowDate),
        banEndAt: MoreThanOrEqual(nowDate),
      },
    });
  }

  // async createReviewBan(uuid: string, banReason: string, banStartDate: Date, banEndDate: Date) {
  //   return await this.reviewBanRepository.save({
  //     user: { uuid: uuid },
  //     banReason: banReason,
  //     banStartDate: banStartDate,
  //     banEndDate: banEndDate,
  //   });
  // }
}
