import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSubmitRecord } from '../entities/shop-submit-user-record.entity';
import { SubmitStatus, SubmitType } from '../const/submit.const';

@Injectable()
export class ShopSubmitRepository {
  constructor(
    @InjectRepository(ShopSubmitRecord)
    private readonly shopSubmitRecordRepository: Repository<ShopSubmitRecord>,
  ) {}

  async findPendingByIdAndTypeWithShop(submitId: number, type: SubmitType): Promise<ShopSubmitRecord | null> {
    return this.shopSubmitRecordRepository.findOne({
      where: { id: submitId, type, status: SubmitStatus.Pending },
      relations: ['shop'],
    });
  }

  async findAllNewShopSubmissions(order: 'ASC' | 'DESC', status: SubmitStatus): Promise<ShopSubmitRecord[]> {
    return this.shopSubmitRecordRepository.find({
      where: { type: SubmitType.NewShop, status },
      relations: ['shop', 'shop.operatingHours', 'shop.productMappings', 'shop.productMappings.product', 'user'],
      order: { createdAt: order },
    });
  }

  async findAllNewOperatingSubmissions(order: 'ASC' | 'DESC', status: SubmitStatus): Promise<ShopSubmitRecord[]> {
    return this.shopSubmitRecordRepository.find({
      where: { type: SubmitType.NewOperating, status },
      relations: ['shop', 'shop.operatingHours', 'shopOperatingHour', 'user'],
      order: { createdAt: order },
    });
  }

  async findAllNewProductSubmissions(order: 'ASC' | 'DESC', status: SubmitStatus): Promise<ShopSubmitRecord[]> {
    return this.shopSubmitRecordRepository.find({
      where: { type: SubmitType.NewProduct, status },
      relations: ['shop', 'shop.productMappings', 'shop.productMappings.product', 'shopProducts', 'shopProducts.product', 'user'],
      order: { createdAt: order },
    });
  }

  async findByIdAndUuid(submitId: number, uuid: string): Promise<ShopSubmitRecord | null> {
    return this.shopSubmitRecordRepository.findOne({
      where: { id: submitId, user: { uuid } },
      relations: ['shop', 'shopOperatingHour'],
    });
  }

  async existsByUuidAndShopIdAndType(uuid: string, shopId: number, type: SubmitType): Promise<boolean> {
    return this.shopSubmitRecordRepository.exists({ where: { user: { uuid }, shop: { id: shopId }, type } });
  }

  async countByUuid(uuid: string): Promise<number> {
    return this.shopSubmitRecordRepository.createQueryBuilder('submit').where('submit.user.uuid = :uuid', { uuid }).getCount();
  }

  async findByUuidWithShop(uuid: string, page: number, limit: number): Promise<ShopSubmitRecord[]> {
    return this.shopSubmitRecordRepository
      .createQueryBuilder('submit')
      .where('submit.user.uuid = :uuid', { uuid })
      .leftJoinAndSelect('submit.shop', 'shop')
      .orderBy('submit.createdAt', 'DESC')
      .skip(limit * (page - 1))
      .take(limit)
      .getMany();
  }
}
