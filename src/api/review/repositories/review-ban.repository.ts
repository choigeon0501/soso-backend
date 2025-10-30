import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ReviewBan } from '../../../database/entity/review-ban.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class ReviewBanRepository {
  constructor(
    @InjectRepository(ReviewBan)
    private reviewBanRepository: Repository<ReviewBan>,
    private readonly loggerService: LoggerService,
  ) {}

  async findUserReviewBanByUuid(uuid: string, nowDate: Date = new Date()) {
    try {
      return await this.reviewBanRepository.findOne({
        where: {
          user: { uuid: uuid },
          banStartAt: LessThanOrEqual(nowDate),
          banEndAt: MoreThanOrEqual(nowDate),
        },
      });
    } catch (err) {
      this.loggerService.warn(`ReviewBan/ findUserReviewBanByUuid Error: ${err}`);
      throw new InternalServerErrorException();
    }
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
