import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ShopReport } from '../entities/shop-report.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { ShopReportDto } from '../dto/requests/report_request';

@Injectable()
export class ShopReportRepository {
  constructor(
    @InjectRepository(ShopReport)
    private readonly shopReportRepository: Repository<ShopReport>,

    private readonly loggerService: LoggerService,
  ) {}

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
