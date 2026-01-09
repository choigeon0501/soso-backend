import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSubmitRecord } from 'src/api/shop/entities/shop-submit-user-record.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { SubmitStatus, SubmitType } from '../../../common/enum/role.enum';

export class ShopSubmitRepository {
  constructor(
    @InjectRepository(ShopSubmitRecord)
    private ShopSubmitRecordRepository: Repository<ShopSubmitRecord>,
    private readonly loggerService: LoggerService,
  ) {}

  async findById(submitId: number) {
    try {
      return await this.ShopSubmitRecordRepository.findOne({
        where: {
          id: submitId,
          status: SubmitStatus.Pending,
        },
        relations: ['shop'],
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findDetailProductSubmitRecord Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllNewShopSubmissions() {
    try {
      return await this.ShopSubmitRecordRepository.find({
        where: {
          type: SubmitType.NewShop,
          status: SubmitStatus.Pending,
        },
        relations: ['shop', 'shop.operatingHours', 'shop.productMappings', 'shop.productMappings.product', 'user'],
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllNewShopSubmissions Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllNewOperatingSubmissions() {
    try {
      return await this.ShopSubmitRecordRepository.find({
        where: {
          type: SubmitType.NewOperating,
          status: SubmitStatus.Pending,
        },
        relations: ['shop', 'shop.operatingHours', 'shopOperatingHour', 'user'],
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllNewOperatingSubmissions Error: ${err}`);
    }
  }

  async findAllNewProductSubmissions() {
    try {
      return await this.ShopSubmitRecordRepository.find({
        where: {
          type: SubmitType.NewProduct,
          status: SubmitStatus.Pending,
        },
        relations: ['shop', 'shop.productMappings', 'shop.productMappings.product', 'shopProducts', 'shopProducts.product', 'user'],
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllNewProductSubmissions Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findSubmitRecordById(submitId: number, uuid: string) {
    try {
      return await this.ShopSubmitRecordRepository.findOne({
        where: {
          id: submitId,
          user: {
            uuid,
          },
        },
        relations: ['shop', 'shopOperatingHour'],
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ cfindSubmitRecordById Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserSubmitRecordByType(uuid: string, shopId: number, type: SubmitType): Promise<ShopSubmitRecord> {
    try {
      return await this.ShopSubmitRecordRepository.findOne({
        where: {
          user: { uuid },
          shop: {
            id: shopId,
          },
          type,
        },
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserSubmitRecordByType Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserShopSubmitRecord(uuid: string) {
    try {
      return await this.ShopSubmitRecordRepository.createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
        .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
        .getCount();
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserShopSubmitRecord Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserShopSubmitRecordByPageNation(uuid: string, page: number, limit: number) {
    try {
      return await this.ShopSubmitRecordRepository.createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
        .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
        .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
        .orderBy('submit.createdAt', 'DESC') // ✅ 최신순 정렬
        .skip(limit * (page - 1)) // ✅ offset 설정
        .take(limit) // ✅ limit 설정
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserShopSubmitRecordByPageNation Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
