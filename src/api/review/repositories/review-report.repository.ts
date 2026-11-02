import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewReport } from '../entities/review-report.entity';
import { ReportReviewDto } from '../dto/request/report-review.dto';

@Injectable()
export class ReviewReportRepository {
  constructor(
    @InjectRepository(ReviewReport)
    private readonly reviewReportRepository: Repository<ReviewReport>,
  ) {}

  async findAllWithReviewAndUser(): Promise<ReviewReport[]> {
    return this.reviewReportRepository.find({ relations: ['review', 'user'] });
  }

  async existsByUuidAndReviewId(uuid: string, reviewId: number): Promise<boolean> {
    return this.reviewReportRepository.exists({ where: { user: { uuid }, review: { id: reviewId } } });
  }

  async create(uuid: string, reviewId: number, body: ReportReviewDto): Promise<ReviewReport> {
    return this.reviewReportRepository.save({
      user: { uuid },
      review: { id: reviewId },
      reportType: body.reportType,
      reportMessage: body.reportMessage,
    });
  }
}
