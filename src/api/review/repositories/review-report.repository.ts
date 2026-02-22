import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ReviewReport } from '../entities/review-report.entity';
import { ReviewReportDto } from '../../shop/dto/requests/report_request';

@Injectable()
export class ReviewReportRepository {
  constructor(
    @InjectRepository(ReviewReport)
    private readonly reviewReportRepository: Repository<ReviewReport>,
  ) {}

  async findAll() {
    return await this.reviewReportRepository.find({ relations: ['review', 'user'] });
  }

  async findReviewReport(uuid: string, reviewId: number) {
    return await this.reviewReportRepository.findOne({
      where: {
        user: { uuid },
        review: { id: reviewId },
      },
    });
  }

  async saveReviewReport(uuid: string, reviewId: number, reviewReportType: ReviewReportDto) {
    return await this.reviewReportRepository.save({
      user: { uuid },
      review: { id: reviewId },
      reportType: reviewReportType.reportType,
      reportMessage: reviewReportType.reportMessage,
    });
  }
}
