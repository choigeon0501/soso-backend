import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { SubmitUserRecord } from '../../database/entity/submit-user-record.entity';
import { Shop } from '../../database/entity/shop.entity';
import { OperatingHours } from '../../database/entity/shop-operating-hour.entity';
import { ProductMapping } from '../../database/entity/shop-product-mapping.entity';
import { SubmitStatus, SubmitType, UsingType } from '../../common/enum/role.enum';
import { SubmitNewProductsDto, SubmitNewShopDto, SubmitShopOperatingHoursDto } from '../shop/dto/requests/submit_shop_requests.dto';

@Injectable()
export class SubmitTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private loggerService: LoggerService,
  ) {}

  async createNewShop(newShopData: SubmitNewShopDto, regionId: number, uuid: string): Promise<void> {
    const { shop, operatingHours, products } = newShopData;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const shopRepo = queryRunner.manager.getRepository(Shop);
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);
      const productRepo = queryRunner.manager.getRepository(ProductMapping);

      const createShop = await shopRepo.save({
        ...shop,
        type: 1,
        region: {
          id: regionId,
        },
      });

      if (operatingHours) {
        await operatingRepo.save({
          shop: { id: createShop.id },
          type: UsingType.Using,
          ...operatingHours,
        });
      }

      if (products) {
        const productMappings = products.map((product) => ({
          product: { id: product.id },
          shopId: createShop.id,
          user: uuid,
          type: UsingType.Using,
        }));
        await productRepo.save(productMappings);
      }

      await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewShop,
        user: {
          uuid,
        },
        shop: {
          id: createShop.id,
        },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ CreateShop Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteShopSubmission(shopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productRepo = queryRunner.manager.getRepository(ProductMapping);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);
      const shopRepo = queryRunner.manager.getRepository(Shop);
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);

      // Step 1: Delete product mappings
      await productRepo.delete({ shopId });

      // Step 2: Delete operating hours
      await operatingRepo.delete({ shop: { id: shopId } });

      // Step 3: Delete shop
      await shopRepo.delete({ id: shopId });

      // Step 4: Delete submission record
      await submitRepo.delete({ shop: { id: shopId } });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ DeleteShop Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async createOperatingHours(shopId: number, operatingData: SubmitShopOperatingHoursDto, uuid: string) {
    const { operatingHours } = operatingData;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);

      const newOperatingHours = await operatingRepo.save({
        shop: { id: shopId },
        type: UsingType.Verifying,
        operatingHours,
      });

      await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewOperating,
        user: {
          uuid,
        },
        shop: {
          id: shopId,
        },
        operatingId: newOperatingHours.id,
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ CreateOperating Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOperatingHoursSubmission(submitId: number, operatingId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
      const operatingRepo = queryRunner.manager.getRepository(OperatingHours);

      await operatingRepo.delete({
        id: operatingId,
        type: UsingType.Verifying,
      });

      await submitRepo.delete({ id: submitId });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ DeleteOperating Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async createProducts(shopId: number, prodcutsData: SubmitNewProductsDto, uuid: string) {
    const { products } = prodcutsData;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);
    const productRepo = queryRunner.manager.getRepository(ProductMapping);

    try {
      const productMappings = products.map((product) => ({
        product: { id: product.id },
        shopId: shopId,
        user: uuid,
        type: UsingType.Verifying,
      }));
      await productRepo.save(productMappings);

      await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewProduct,
        user: {
          uuid,
        },
        shop: {
          id: shopId,
        },
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ CreateProducts Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProductSubmission(shopId: number, uuid: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productRepo = queryRunner.manager.getRepository(ProductMapping);
      const submitRepo = queryRunner.manager.getRepository(SubmitUserRecord);

      // Step 1: Delete product mappings of type Verifying by this user
      await productRepo.delete({
        shopId: shopId,
        user: uuid,
        type: UsingType.Verifying,
      });

      // Step 2: Delete submit record for NewProduct
      await submitRepo.delete({
        shop: { id: shopId },
        user: { uuid },
        type: SubmitType.NewProduct,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`Submit/ DeleteProduct Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
