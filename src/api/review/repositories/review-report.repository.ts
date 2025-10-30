import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReviewReport } from '../entities/review-report.entity';
import { ReviewReportDto } from '../../shop/dto/requests/report_request';
import { LoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class ReviewReportRepository {
  constructor(
    @InjectRepository(ReviewReport)
    private readonly reviewReportRepository: Repository<ReviewReport>,

    private readonly loggerService: LoggerService,
  ) {}

  async findReviewReport(uuid: string, reviewId: number) {
    try {
      return await this.reviewReportRepository.findOne({
        where: {
          user: { uuid },
          review: { id: reviewId },
        },
      });
    } catch (err) {
      this.loggerService.warn(`Report/ findReviewReport Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async saveReviewReport(uuid: string, reviewId: number, reviewReportType: ReviewReportDto) {
    try {
      return await this.reviewReportRepository.save({
        user: { uuid },
        review: { id: reviewId },
        reportType: reviewReportType.reportType,
        reportMessage: reviewReportType.reportMessage,
      });
    } catch (err) {
      this.loggerService.warn(`Report/ saveReviewReport Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
