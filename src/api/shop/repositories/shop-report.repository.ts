import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopReport } from '../entities/shop-report.entity';
import { ReportShopDto } from '../dto/request/report-shop.dto';

@Injectable()
export class ShopReportRepository {
  constructor(
    @InjectRepository(ShopReport)
    private readonly shopReportRepository: Repository<ShopReport>,
  ) {}

  async findAllWithShopAndUser(): Promise<ShopReport[]> {
    return this.shopReportRepository.find({ relations: ['shop', 'user'] });
  }

  async existsByUuidAndShopId(uuid: string, shopId: number): Promise<boolean> {
    return this.shopReportRepository.exists({ where: { user: { uuid }, shop: { id: shopId } } });
  }

  async create(uuid: string, shopId: number, body: ReportShopDto): Promise<ShopReport> {
    return this.shopReportRepository.save({
      user: { uuid },
      shop: { id: shopId },
      reportType: body.reportType,
      reportMessage: body.reportMessage,
    });
  }
}
