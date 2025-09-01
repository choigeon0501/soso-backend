import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmitUserRecord } from 'src/database/entity/submit-user-record.entity';
import { LoggerService } from '../logger/logger.service';

export class SubmitRepository {
  constructor(
    @InjectRepository(SubmitUserRecord)
    private submitUserRecordRepository: Repository<SubmitUserRecord>,
    private readonly loggerService: LoggerService,
  ) {}

  async findSubmitRecordById(submitId: number, uuid: string) {
    try {
      return await this.submitUserRecordRepository.findOne({
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

  async findUserSubmitRecordByType(uuid: string, shopId: number, type: number): Promise<SubmitUserRecord> {
    try {
      return await this.submitUserRecordRepository.findOne({
        where: {
          user: { uuid },
          shop: {
            id: shopId,
          },
          type,
          status: 0, // 확인중
        },
      });
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserSubmitRecordByType Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserSubmitUserRecord(uuid: string) {
    try {
      return await this.submitUserRecordRepository
        .createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
        .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
        .getCount();
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserSubmitUserRecord Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findUserSubmitUserRecordByPageNation(uuid: string, page: number, limit: number) {
    try {
      return await this.submitUserRecordRepository
        .createQueryBuilder('submit') // ✅ 엔티티 별칭 수정
        .where('submit.user.uuid = :uuid', { uuid }) // ✅ where 절 수정
        .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
        .orderBy('submit.createdAt', 'DESC') // ✅ 최신순 정렬
        .skip(limit * (page - 1)) // ✅ offset 설정
        .take(limit) // ✅ limit 설정
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Submit/ findUserSubmitUserRecordByPageNation Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllSubmitProducts() {
    try {
      return await this.submitUserRecordRepository
        .createQueryBuilder('submit')
        .where('submit.type=2')
        .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
        .leftJoinAndSelect('shop.productMappings', 'productMappings')
        .leftJoinAndSelect('submit.user', 'user') // ✅ shop 관계 조인
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllSubmitProducts Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllSubmitOperatings() {
    try {
      return await this.submitUserRecordRepository
        .createQueryBuilder('submit')
        .where('submit.type=1')
        .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
        .leftJoinAndSelect('shop.operatingHours', 'operatingHours')
        .leftJoinAndSelect('submit.user', 'user') // ✅ shop 관계 조인
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllSubmitProducts Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  async findAllSubmitNewShops() {
    try {
      return await this.submitUserRecordRepository
        .createQueryBuilder('submit')
        .where('submit.type=0')
        .leftJoinAndSelect('submit.shop', 'shop') // ✅ shop 관계 조인
        .leftJoinAndSelect('shop.operatingHours', 'operatingHours')
        .leftJoinAndSelect('shop.productMappings', 'productMappings')
        .leftJoinAndSelect('submit.user', 'user') // ✅ shop 관계 조인
        .getMany();
    } catch (err) {
      this.loggerService.warn(`Submit/ findAllSubmitProducts Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
