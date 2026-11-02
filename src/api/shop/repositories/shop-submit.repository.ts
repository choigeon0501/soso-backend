import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSubmitRecord } from '../entities/shop-submit-user-record.entity';
import { SubmitStatus, SubmitType } from '../const/submit.const';

export class ShopSubmitRepository {
  constructor(
    @InjectRepository(ShopSubmitRecord)
    private ShopSubmitRecordRepository: Repository<ShopSubmitRecord>,
  ) {}

  async findNewProductById(submitId: number) {
    return await this.ShopSubmitRecordRepository.findOne({
      where: {
        id: submitId,
        type: SubmitType.NewProduct,
        status: SubmitStatus.Pending,
      },
      relations: ['shop'],
    });
  }

  async findNewOperatingInfoById(submitId: number) {
    return await this.ShopSubmitRecordRepository.findOne({
      where: {
        id: submitId,
        type: SubmitType.NewOperating,
        status: SubmitStatus.Pending,
      },
      relations: ['shop'],
    });
  }

  async findNewShopById(submitId: number) {
    return await this.ShopSubmitRecordRepository.findOne({
      where: {
        id: submitId,
        type: SubmitType.NewShop,
        status: SubmitStatus.Pending,
      },
      relations: ['shop'],
    });
  }

  async findAllNewShopSubmissions(order: 'ASC' | 'DESC' = 'DESC', status: SubmitStatus = SubmitStatus.Pending) {
    return await this.ShopSubmitRecordRepository.find({
      where: {
        type: SubmitType.NewShop,
        status,
      },
      relations: ['shop', 'shop.operatingHours', 'shop.productMappings', 'shop.productMappings.product', 'user'],
      order: { createdAt: order },
    });
  }

  async findAllNewOperatingSubmissions(order: 'ASC' | 'DESC' = 'DESC', status: SubmitStatus = SubmitStatus.Pending) {
    return await this.ShopSubmitRecordRepository.find({
      where: {
        type: SubmitType.NewOperating,
        status,
      },
      relations: ['shop', 'shop.operatingHours', 'shopOperatingHour', 'user'],
      order: { createdAt: order },
    });
  }

  async findAllNewProductSubmissions(order: 'ASC' | 'DESC' = 'DESC', status: SubmitStatus = SubmitStatus.Pending) {
    return await this.ShopSubmitRecordRepository.find({
      where: {
        type: SubmitType.NewProduct,
        status,
      },
      relations: ['shop', 'shop.productMappings', 'shop.productMappings.product', 'shopProducts', 'shopProducts.product', 'user'],
      order: { createdAt: order },
    });
  }

  async findSubmitRecordById(submitId: number, uuid: string) {
    return await this.ShopSubmitRecordRepository.findOne({
      where: {
        id: submitId,
        user: {
          uuid,
        },
      },
      relations: ['shop', 'shopOperatingHour'],
    });
  }

  async findUserSubmitRecordByType(uuid: string, shopId: number, type: SubmitType): Promise<ShopSubmitRecord> {
    return await this.ShopSubmitRecordRepository.findOne({
      where: {
        user: { uuid },
        shop: {
          id: shopId,
        },
        type,
      },
    });
  }

  async findUserShopSubmitRecord(uuid: string) {
    return await this.ShopSubmitRecordRepository.createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
      .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
      .getCount();
  }

  async findUserShopSubmitRecordByPageNation(uuid: string, page: number, limit: number) {
    return await this.ShopSubmitRecordRepository.createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
      .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
      .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
      .orderBy('submit.createdAt', 'DESC') // ✅ 최신순 정렬
      .skip(limit * (page - 1)) // ✅ offset 설정
      .take(limit) // ✅ limit 설정
      .getMany();
  }
}
