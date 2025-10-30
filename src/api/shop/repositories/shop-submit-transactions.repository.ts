import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { ShopSubmitRecord } from '../entities/shop-submit-user-record.entity';
import { Shop } from '../entities/shop.entity';
import { SubmitStatus, SubmitType } from '../../../common/enum/role.enum';
import { SubmitNewProductsDto, SubmitNewShopDto, SubmitShopOperatingHoursDto } from '../dto/requests/submit_shop_requests.dto';
import { ShopOperatingHour } from '../entities/shop-operating-hour.entity';
import { ShopProductMapping } from '../entities/shop-product-mapping.entity';

@Injectable()
export class ShopSubmitTransactionsRepository {
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
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const operatingRepo = queryRunner.manager.getRepository(ShopOperatingHour);
      const productRepo = queryRunner.manager.getRepository(ShopProductMapping);

      const createShop = await shopRepo.save({
        ...shop,
        isVerified: false,
        region: {
          id: regionId,
        },
      });

      if (operatingHours) {
        await operatingRepo.save({
          shop: { id: createShop.id },
          isVerified: false,
          ...operatingHours,
        });
      }

      if (products) {
        const productMappings = products.map((product) => ({
          product: { id: product.id },
          shop: { id: createShop.id },
          isVerified: false,
        }));
        await productRepo.save(productMappings);
      }

      await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewShop,
        user: { uuid },
        shop: { id: createShop.id },
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
      const productRepo = queryRunner.manager.getRepository(ShopProductMapping);
      const operatingRepo = queryRunner.manager.getRepository(ShopOperatingHour);
      const shopRepo = queryRunner.manager.getRepository(Shop);
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);

      // Step 1: Delete product mappings
      await productRepo.delete({ shop: { id: shopId } });

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
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const operatingRepo = queryRunner.manager.getRepository(ShopOperatingHour);

      const newOperatingHours = await operatingRepo.save({
        shop: { id: shopId },
        isVerified: false,
        ...operatingHours,
      });

      await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewOperating,
        user: { uuid },
        shop: { id: shopId },
        shopOperatingHour: { id: newOperatingHours.id },
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
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const operatingRepo = queryRunner.manager.getRepository(ShopOperatingHour);

      await operatingRepo.delete({
        id: operatingId,
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

  async createProducts(shopId: number, productsData: SubmitNewProductsDto, uuid: string) {
    const { products } = productsData;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const productRepo = queryRunner.manager.getRepository(ShopProductMapping);

      const createSubmitRecord = await submitRepo.save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewProduct,
        user: {
          uuid,
        },
        shop: {
          id: shopId,
        },
      });

      const productMappings = products.map((product) => ({
        product: { id: product.id },
        shop: { id: shopId },
        submitRecord: { id: createSubmitRecord.id },
        isVerified: false,
      }));

      await productRepo.save(productMappings);
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
      const productRepo = queryRunner.manager.getRepository(ShopProductMapping);
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);

      // Step 1: Delete product mappings of type Verifying by this user
      await productRepo.delete({
        shop: { id: shopId },
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
