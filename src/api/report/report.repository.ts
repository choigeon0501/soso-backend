import { InjectRepository } from '@nestjs/typeorm';
import { ReviewReport } from '../../database/entity/review-report.entity';
import { Repository } from 'typeorm';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ShopReport } from '../../database/entity/shop-report.entity';
import { LoggerService } from '../logger/logger.service';
import { ReviewReportType, ShopReportType } from '../../common/enum/report.enum';
import { ReviewReportDto, ShopReportDto } from '../shop/dto/requests/report_request';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(ReviewReport)
    private readonly reviewReportRepository: Repository<ReviewReport>,

    @InjectRepository(ShopReport)
    private readonly shopReportRepository: Repository<ShopReport>,

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

  async findShopReport(uuid: string, shopId: number) {
    try {
      return await this.shopReportRepository.findOne({
        where: {
          user: { uuid },
          shop: { id: shopId },
        },
      });
    } catch (err) {
      this.loggerService.warn(`Report/findShopReport Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async saveShopReport(uuid: string, shopId: number, shopReportType: ShopReportDto) {
    try {
      return await this.shopReportRepository.save({
        user: { uuid },
        shop: { id: shopId },
        reportType: shopReportType.reportType,
        reportMessage: shopReportType.reportMessage,
      });
    } catch (err) {
      this.loggerService.warn(`Report/ saveShopReport Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
