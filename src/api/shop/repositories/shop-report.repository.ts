import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ShopReport } from '../entities/shop-report.entity';
import { ShopReportDto } from '../dto/requests/report_request';

@Injectable()
export class ShopReportRepository {
  constructor(
    @InjectRepository(ShopReport)
    private readonly shopReportRepository: Repository<ShopReport>,
  ) {}

  async findAll() {
    return await this.shopReportRepository.find({ relations: ['shop', 'user'] });
  }

  async findShopReport(uuid: string, shopId: number) {
    return await this.shopReportRepository.findOne({
      where: {
        user: { uuid },
        shop: { id: shopId },
      },
    });
  }

  async saveShopReport(uuid: string, shopId: number, shopReportType: ShopReportDto) {
    return await this.shopReportRepository.save({
      user: { uuid },
      shop: { id: shopId },
      reportType: shopReportType.reportType,
      reportMessage: shopReportType.reportMessage,
    });
  }
}
