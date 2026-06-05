import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ShopSubmitRecord } from '../entities/shop-submit-user-record.entity';
import { Shop } from '../entities/shop.entity';
import { SubmitStatus, SubmitType } from '../../../common/enum/role.enum';
import { normalizePhoneNumber } from '../../../common/function/normalize-phone-number.function';
import { SubmitNewProductsDto, SubmitNewShopDto, SubmitShopOperatingHoursDto } from '../dto/requests/submit_shop_requests.dto';
import { ShopOperatingHour } from '../entities/shop-operating-hour.entity';
import { ShopProductMapping } from '../entities/shop-product-mapping.entity';

@Injectable()
export class ShopSubmitTransactionsRepository {
  constructor(
    private dataSource: DataSource,
  ) {}

  async rejectNewShopSubmission(submitId: number, shopId: number, rejectMessage: string | null = null): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopRepo = queryRunner.manager.getRepository(Shop);

      // 제보한 운영정보 데이터 제거
      await shopRepo.delete({
        id: shopId,
        isVerified: false,
      });

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewShop,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Rejected,
          rejectMessage: rejectMessage,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
       await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async acceptNewShopSubmission(submitId: number, shopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopRepo = queryRunner.manager.getRepository(Shop);

      // 실제 운영 중인 운영정보 데이터 제거
      await shopRepo.update(
        {
          id: shopId,
          isVerified: false,
        },
        {
          isVerified: true,
        },
      );

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewShop,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Approved,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async rejectOperatingInfoSubmission(submitId: number, rejectMessage: string | null = null): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopOperatingHourRepo = queryRunner.manager.getRepository(ShopOperatingHour);

      const submitOperatingHour = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewOperating,
          status: SubmitStatus.Pending,
        },
        relations: ['shopOperatingHour'],
      });

      // 제보한 운영정보 데이터 제거
      await shopOperatingHourRepo.delete({
        id: submitOperatingHour.shopOperatingHour.id,
        isVerified: false,
      });

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewOperating,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Rejected,
          rejectMessage: rejectMessage,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async acceptOperatingInfoSubmission(submitId: number, shopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopOperatingHourRepo = queryRunner.manager.getRepository(ShopOperatingHour);

      const submitOperatingHour = await submitRepo.findOne({
        where: {
          id: submitId,
          type: SubmitType.NewOperating,
          status: SubmitStatus.Pending,
        },
        relations: ['shopOperatingHour'],
      });

      // 실제 운영 중인 운영정보 데이터 제거
      await shopOperatingHourRepo.delete({
        shop: { id: shopId },
        isVerified: true,
      });

      // 제보한 운영정보 실제 운영 데이터로 업데이트
      await shopOperatingHourRepo.update(
        {
          id: submitOperatingHour.shopOperatingHour.id,
          isVerified: false,
        },
        {
          isVerified: true,
        },
      );

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewOperating,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Approved,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async rejectProductSubmission(submitId: number, rejectMessage: string | null = null): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopProductRepo = queryRunner.manager.getRepository(ShopProductMapping);

      // 제보한 판매목록 데이터 제거
      await shopProductRepo.delete({
        submitRecord: {
          id: submitId,
          type: SubmitType.NewProduct,
          status: SubmitStatus.Pending,
        },
        isVerified: false,
      });

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewProduct,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Rejected,
          rejectMessage: rejectMessage,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async acceptProductSubmission(submitId: number, shopId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const submitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const shopProductRepo = queryRunner.manager.getRepository(ShopProductMapping);

      // 실제 운영 중인 판매목록 데이터 제거
      await shopProductRepo.delete({
        shop: { id: shopId },
        isVerified: true,
      });

      // 제보한 판매목록 실제 운영 데이터로 업데이트
      await shopProductRepo.update(
        {
          submitRecord: {
            id: submitId,
            type: SubmitType.NewProduct,
            status: SubmitStatus.Pending,
          },
          isVerified: false,
        },
        {
          isVerified: true,
        },
      );

      // 제보한 데이터 상태 변경
      await submitRepo.update(
        {
          id: submitId,
          type: SubmitType.NewProduct,
          status: SubmitStatus.Pending,
        },
        {
          status: SubmitStatus.Approved,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

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
        name: shop.name,
        lat: shop.lat,
        lng: shop.lng,
        location: shop.location,
        isVerified: false,
        region: {
          id: regionId,
        },
      });

      if (operatingHours) {
        await operatingRepo.save({
          shop: { id: createShop.id },
          isVerified: true, // true로 두는 이유는, 어차피 shop의 verified만 true로 바꾸면 전부 사용할 수 있도록 해야 되기 때문 -> shop에 종속되어있음
          ...operatingHours,
          phoneNumber: normalizePhoneNumber(operatingHours.phoneNumber),
        });
      }

      if (products) {
        const productMappings = products.map((product) => ({
          product: { id: product.id },
          shop: { id: createShop.id },
          isVerified: true, // true로 두는 이유는, 어차피 shop의 verified만 true로 바꾸면 전부 사용할 수 있도록 해야 되기 때문 -> shop에 종속되어있음
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
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteShopSubmission(submitId: number, shopId: number): Promise<void> {
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
      await submitRepo.delete({ id: submitId });

      await queryRunner.commitTransaction();
    } catch (err) {
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
        phoneNumber: normalizePhoneNumber(operatingHours.phoneNumber),
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
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProductSubmission(submitId: number, shopId: number, uuid: string): Promise<void> {
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
      await submitRepo.delete({ id: submitId });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
