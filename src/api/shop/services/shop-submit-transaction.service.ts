import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { ShopSubmitRecord } from '../entities/shop-submit-user-record.entity';
import { Shop } from '../entities/shop.entity';
import { ShopOperatingHour } from '../entities/shop-operating-hour.entity';
import { ShopProductMapping } from '../entities/shop-product-mapping.entity';
import { SubmitStatus, SubmitType } from '../const/submit.const';
import { normalizePhoneNumber } from '../utils/normalize-phone-number.util';
import { SubmitNewShopDto } from '../dto/request/submit-new-shop.dto';
import { SubmitShopOperatingHoursDto } from '../dto/request/submit-shop-operating-hours.dto';
import { SubmitNewProductsDto } from '../dto/request/submit-new-products.dto';

@Injectable()
export class ShopSubmitTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  async rejectNewShopSubmission(submitId: number, shopId: number, rejectMessage: string | null = null): Promise<void> {
    await this.runInTransaction('rejectNewShopSubmission', async (manager) => {
      await manager.getRepository(Shop).delete({ id: shopId, isVerified: false });
      await manager
        .getRepository(ShopSubmitRecord)
        .update({ id: submitId, type: SubmitType.NewShop, status: SubmitStatus.Pending }, { status: SubmitStatus.Rejected, rejectMessage });
    });
  }

  async acceptNewShopSubmission(submitId: number, shopId: number): Promise<void> {
    await this.runInTransaction('acceptNewShopSubmission', async (manager) => {
      await manager.getRepository(Shop).update({ id: shopId, isVerified: false }, { isVerified: true });
      await manager
        .getRepository(ShopSubmitRecord)
        .update({ id: submitId, type: SubmitType.NewShop, status: SubmitStatus.Pending }, { status: SubmitStatus.Approved });
    });
  }

  async rejectOperatingInfoSubmission(submitId: number, rejectMessage: string | null = null): Promise<void> {
    await this.runInTransaction('rejectOperatingInfoSubmission', async (manager) => {
      const submitRepository = manager.getRepository(ShopSubmitRecord);

      const record = await submitRepository.findOne({
        where: { id: submitId, type: SubmitType.NewOperating, status: SubmitStatus.Pending },
        relations: ['shopOperatingHour'],
      });

      await manager.getRepository(ShopOperatingHour).delete({ id: record.shopOperatingHour.id, isVerified: false });
      await submitRepository.update(
        { id: submitId, type: SubmitType.NewOperating, status: SubmitStatus.Pending },
        { status: SubmitStatus.Rejected, rejectMessage },
      );
    });
  }

  /**
   * 운영 중인 운영정보를 지우고 제보된 운영정보를 운영 데이터로 올린다.
   */
  async acceptOperatingInfoSubmission(submitId: number, shopId: number): Promise<void> {
    await this.runInTransaction('acceptOperatingInfoSubmission', async (manager) => {
      const submitRepository = manager.getRepository(ShopSubmitRecord);
      const operatingHourRepository = manager.getRepository(ShopOperatingHour);

      const record = await submitRepository.findOne({
        where: { id: submitId, type: SubmitType.NewOperating, status: SubmitStatus.Pending },
        relations: ['shopOperatingHour'],
      });

      await operatingHourRepository.delete({ shop: { id: shopId }, isVerified: true });
      await operatingHourRepository.update({ id: record.shopOperatingHour.id, isVerified: false }, { isVerified: true });
      await submitRepository.update({ id: submitId, type: SubmitType.NewOperating, status: SubmitStatus.Pending }, { status: SubmitStatus.Approved });
    });
  }

  async rejectProductSubmission(submitId: number, rejectMessage: string | null = null): Promise<void> {
    await this.runInTransaction('rejectProductSubmission', async (manager) => {
      await manager.getRepository(ShopProductMapping).delete({
        submitRecord: { id: submitId, type: SubmitType.NewProduct, status: SubmitStatus.Pending },
        isVerified: false,
      });
      await manager
        .getRepository(ShopSubmitRecord)
        .update({ id: submitId, type: SubmitType.NewProduct, status: SubmitStatus.Pending }, { status: SubmitStatus.Rejected, rejectMessage });
    });
  }

  /**
   * 운영 중인 판매목록을 지우고 제보된 판매목록을 운영 데이터로 올린다.
   */
  async acceptProductSubmission(submitId: number, shopId: number): Promise<void> {
    await this.runInTransaction('acceptProductSubmission', async (manager) => {
      const productMappingRepository = manager.getRepository(ShopProductMapping);

      await productMappingRepository.delete({ shop: { id: shopId }, isVerified: true });
      await productMappingRepository.update(
        { submitRecord: { id: submitId, type: SubmitType.NewProduct, status: SubmitStatus.Pending }, isVerified: false },
        { isVerified: true },
      );
      await manager
        .getRepository(ShopSubmitRecord)
        .update({ id: submitId, type: SubmitType.NewProduct, status: SubmitStatus.Pending }, { status: SubmitStatus.Approved });
    });
  }

  /**
   * 운영정보·판매목록은 isVerified=true로 저장한다. 노출 여부는 샵의 isVerified 하나로 결정되기 때문이다.
   */
  async createNewShop(body: SubmitNewShopDto, regionId: number, uuid: string): Promise<void> {
    const { shop, operatingHours, products } = body;

    await this.runInTransaction('createNewShop', async (manager) => {
      const createdShop = await manager.getRepository(Shop).save({
        name: shop.name,
        lat: shop.lat,
        lng: shop.lng,
        location: shop.location,
        isVerified: false,
        region: { id: regionId },
      });

      if (operatingHours) {
        await manager.getRepository(ShopOperatingHour).save({
          shop: { id: createdShop.id },
          isVerified: true,
          ...operatingHours,
          phoneNumber: normalizePhoneNumber(operatingHours.phoneNumber),
        });
      }

      if (products) {
        await manager
          .getRepository(ShopProductMapping)
          .save(products.map((product) => ({ product: { id: product.id }, shop: { id: createdShop.id }, isVerified: true })));
      }

      await manager.getRepository(ShopSubmitRecord).save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewShop,
        user: { uuid },
        shop: { id: createdShop.id },
      });
    });
  }

  async deleteShopSubmission(submitId: number, shopId: number): Promise<void> {
    await this.runInTransaction('deleteShopSubmission', async (manager) => {
      await manager.getRepository(ShopProductMapping).delete({ shop: { id: shopId } });
      await manager.getRepository(ShopOperatingHour).delete({ shop: { id: shopId } });
      await manager.getRepository(Shop).delete({ id: shopId });
      await manager.getRepository(ShopSubmitRecord).delete({ id: submitId });
    });
  }

  async createOperatingHours(shopId: number, body: SubmitShopOperatingHoursDto, uuid: string): Promise<void> {
    const { operatingHours } = body;

    await this.runInTransaction('createOperatingHours', async (manager) => {
      const createdOperatingHour = await manager.getRepository(ShopOperatingHour).save({
        shop: { id: shopId },
        isVerified: false,
        ...operatingHours,
        phoneNumber: normalizePhoneNumber(operatingHours.phoneNumber),
      });

      await manager.getRepository(ShopSubmitRecord).save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewOperating,
        user: { uuid },
        shop: { id: shopId },
        shopOperatingHour: { id: createdOperatingHour.id },
      });
    });
  }

  async deleteOperatingHoursSubmission(submitId: number, operatingHourId: number): Promise<void> {
    await this.runInTransaction('deleteOperatingHoursSubmission', async (manager) => {
      await manager.getRepository(ShopOperatingHour).delete({ id: operatingHourId });
      await manager.getRepository(ShopSubmitRecord).delete({ id: submitId });
    });
  }

  async createProducts(shopId: number, body: SubmitNewProductsDto, uuid: string): Promise<void> {
    const { products } = body;

    await this.runInTransaction('createProducts', async (manager) => {
      const createdRecord = await manager.getRepository(ShopSubmitRecord).save({
        status: SubmitStatus.Pending,
        type: SubmitType.NewProduct,
        user: { uuid },
        shop: { id: shopId },
      });

      await manager.getRepository(ShopProductMapping).save(
        products.map((product) => ({
          product: { id: product.id },
          shop: { id: shopId },
          submitRecord: { id: createdRecord.id },
          isVerified: false,
        })),
      );
    });
  }

  /**
   * 샵의 판매목록 매핑을 전부 지운다(제보분만 골라 지우지 않는다).
   */
  async deleteProductSubmission(submitId: number, shopId: number): Promise<void> {
    await this.runInTransaction('deleteProductSubmission', async (manager) => {
      await manager.getRepository(ShopProductMapping).delete({ shop: { id: shopId } });
      await manager.getRepository(ShopSubmitRecord).delete({ id: submitId });
    });
  }

  private async runInTransaction(name: string, work: (manager: EntityManager) => Promise<void>): Promise<void> {
    try {
      await this.dataSource.transaction(work);
    } catch (err) {
      this.loggerService.logError(`ShopSubmitTransaction/ ${name} Error`, err);
      throw new InternalServerErrorException();
    }
  }
}
