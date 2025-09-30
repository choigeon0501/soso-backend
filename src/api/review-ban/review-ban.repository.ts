import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewBan } from '../../database/entity/review-ban.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewBanRepository {
  constructor(
    @InjectRepository(ReviewBan)
    private reviewBanRepository: Repository<ReviewBan>,
  ) {}

  async findUserReviewBanByUuid(uuid: string) {
    return await this.reviewBanRepository.findOne({
      where: {
        user: { uuid: uuid },
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
