import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { SubmitUserRecord } from '../../database/entity/submit-user-record.entity';
import { ProductMapping } from '../../database/entity/shop-product-mapping.entity';
import { SubmitStatus, SubmitType } from '../../common/enum/role.enum';
import { OperatingHours } from '../../database/entity/shop-operating-hour.entity';
import { Shop } from '../../database/entity/shop.entity';

@Injectable()
export class AdminTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private loggerService: LoggerService,
  ) {}

  async allowSubmitProduct(submitId: number, userUUID: string, shopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const productRepo = queryRunner.manager.getRepository(ProductMapping);

      // 해당 유저가 제출한 submit status를 완료로 바꾸기
      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewProduct,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Approved;
      await submitRepo.save(userSubmitData);

      // shopId로 product_mapping 테이블을 서칭해서 현재 type:0 인 정보 delete하기
      const usingProductsMapping = await productRepo.find({
        where: {
          shopId,
          type: 0,
        },
      });

      if (usingProductsMapping.length > 0) {
        await productRepo.remove(usingProductsMapping);
      }

      // 유저의 uuid와 shopId로 product_mapping 테이블을 서칭해서 유저가 제안한 products의 type 0으로 업데이트하기
      const submitProductMappings = await productRepo.find({
        where: {
          shopId,
          user: userUUID,
          type: 1,
        },
      });

      if (submitProductMappings.length === 0) {
        throw new NotFoundException('Not Found Submit Products Mapping');
      }

      await Promise.all(
        submitProductMappings.map(async (data) => {
          data.type = 0;
          return productRepo.save(data);
        }),
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ AllowSubmitProduct Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async rejectSubmitProduct(submitId: number, userUUID: string, shopId: number, rejectMessage: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const productRepo = queryRunner.manager.getRepository(ProductMapping);

      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewProduct,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Rejected;
      userSubmitData.rejectMessage = rejectMessage;
      await submitRepo.save(userSubmitData);

      await productRepo.delete({
        shopId,
        user: userUUID,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ RejectSubmitProduct Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async allowSubmitOperatingInfo(submitId: number, userUUID: string, shopId: number, operatingId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);
      const shopRepo = queryRunner.manager.getRepository(Shop);

      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewOperating,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Approved;
      await submitRepo.save(userSubmitData);

      const shop = await shopRepo.findOne({
        where: {
          id: shopId,
        },
      });

      if (!shop) {
        throw new NotFoundException('Not Found Shop');
      }

      await operatingRepo.delete({
        shop: { id: shopId },
        type: 0,
      });

      const submitOperating = await operatingRepo.findOne({
        where: {
          id: operatingId,
          shop: { id: shopId },
        },
      });

      if (!submitOperating) {
        throw new NotFoundException('Not Found Submit Operating Info');
      }

      submitOperating.type = 0;
      await operatingRepo.save(submitOperating);

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ AllowSubmitOperatingInfo Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async rejectSubmitOperatingInfo(submitId: number, userUUID: string, operatingId: number, rejectMessage: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);

      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewOperating,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Rejected;
      userSubmitData.rejectMessage = rejectMessage;
      await submitRepo.save(userSubmitData);

      await operatingRepo.delete({
        id: operatingId,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ RejectSubmitOperatingInfo Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async allowNewShop(submitId: number, userUUID: string, newShopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const shopRepo = queryRunner.manager.getRepository(Shop);

      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewShop,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Approved;
      await submitRepo.save(userSubmitData);

      const shop = await shopRepo.findOne({
        where: {
          id: newShopId,
        },
      });

      if (!shop) {
        throw new NotFoundException('Not Found Shop');
      }

      shop.type = 0;
      await shopRepo.save(shop);

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ AllowNewShop Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async rejectNewShop(submitId: number, userUUID: string, newShopId: number, rejectMessage: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const shopRepo = queryRunner.manager.getRepository(Shop);
      const productRepo = queryRunner.manager.getRepository(ProductMapping);

      const userSubmitData = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewShop,
          user: { uuid: userUUID },
        },
      });

      if (!userSubmitData) {
        throw new NotFoundException('Not Found User Submit Record');
      }

      userSubmitData.status = SubmitStatus.Rejected;
      userSubmitData.rejectMessage = rejectMessage;
      userSubmitData.shop = null;
      await submitRepo.save(userSubmitData);

      await shopRepo.delete({
        id: newShopId,
      });

      await productRepo.delete({
        shopId: newShopId,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Admin/ RejectNewShop Error: ${err}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
