import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ShopRepository } from '../repositories/shop.repository';
import { ShopSubmitRepository } from '../repositories/shop-submit.repository';
import { ShopSubmitTransactionService } from './shop-submit-transaction.service';
import { RegionService } from '../../region/region.service';
import { SubmitStatus, SubmitType, getSubmitCombinedStatus } from '../const/submit.const';
import { normalizeRegionName } from '../const/region-name.const';
import { withNormalizedPhoneNumber } from '../utils/normalize-phone-number.util';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { GetSubmissionsQueryDto } from '../dto/query/get-submissions-query.dto';
import { SubmitNewShopDto } from '../dto/request/submit-new-shop.dto';
import { SubmitShopOperatingHoursDto } from '../dto/request/submit-shop-operating-hours.dto';
import { SubmitNewProductsDto } from '../dto/request/submit-new-products.dto';
import { RejectSubmissionDto } from '../dto/request/reject-submission.dto';
import { GetMySubmissionsResponseDto } from '../dto/response/get-my-submissions-response.dto';

@Injectable()
export class ShopSubmitService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopSubmitRepository: ShopSubmitRepository,
    private readonly shopSubmitTransactionService: ShopSubmitTransactionService,
    private readonly regionService: RegionService,
  ) {}

  async submitNewShop(body: SubmitNewShopDto, uuid: string): Promise<void> {
    const regionName = normalizeRegionName(body.shop.region1DepthName);
    if (!regionName) {
      throw new BadRequestException('유효하지 않은 지역(region1DepthName)입니다.');
    }

    const region = await this.regionService.findRegionByName(regionName);
    if (!region) {
      throw new NotFoundException('일치하는 지역(region)을 찾을 수 없습니다.');
    }

    await this.shopSubmitTransactionService.createNewShop(body, region.id, uuid);
  }

  async submitOperatingHours(shopId: number, body: SubmitShopOperatingHoursDto, uuid: string): Promise<void> {
    const shop = await this.shopRepository.findVisibleById(shopId);
    if (!shop) {
      throw new ConflictException('Not Exist Shop');
    }

    const alreadySubmitted = await this.shopSubmitRepository.existsByUuidAndShopIdAndType(uuid, shopId, SubmitType.NewOperating);
    if (alreadySubmitted) {
      throw new ConflictException('Exist Data');
    }

    await this.shopSubmitTransactionService.createOperatingHours(shopId, body, uuid);
  }

  async submitProducts(shopId: number, body: SubmitNewProductsDto, uuid: string): Promise<void> {
    const shop = await this.shopRepository.findVisibleById(shopId);
    if (!shop) {
      throw new ConflictException('Not Exist Shop');
    }

    const alreadySubmitted = await this.shopSubmitRepository.existsByUuidAndShopIdAndType(uuid, shopId, SubmitType.NewProduct);
    if (alreadySubmitted) {
      throw new ConflictException('Exist Data');
    }

    await this.shopSubmitTransactionService.createProducts(shopId, body, uuid);
  }

  async findMySubmissions(query: PaginationQueryDto, uuid: string): Promise<GetMySubmissionsResponseDto> {
    const { page, limit } = query;

    const totalElements = await this.shopSubmitRepository.countByUuid(uuid);
    const records = await this.shopSubmitRepository.findByUuidWithShop(uuid, page, limit);

    const totalPages = Math.ceil(totalElements / limit);

    return {
      data: records.map((record) => ({
        id: record.id,
        type: record.type,
        status: record.status,
        submitStatus: getSubmitCombinedStatus(record.type, record.status),
        rejectMessage: record.rejectMessage,
        createdAt: record.createdAt,
        shop: record.shop
          ? {
              id: record.shop.id,
              name: record.shop.name,
              mainImage: record.shop.mainImage ?? null,
              isVerified: !!record.shop.isVerified,
              instagram: record.shop.instagram ?? null,
              location: record.shop.location ?? null,
            }
          : null,
      })),
      pageInfo: { page, limit, totalElements, totalPages, nextPage: page < totalPages },
    };
  }

  async deleteMySubmission(submitId: number, uuid: string): Promise<void> {
    const record = await this.shopSubmitRepository.findByIdAndUuid(submitId, uuid);
    if (!record) {
      throw new NotFoundException('Not found Submission');
    }

    switch (record.type) {
      case SubmitType.NewShop:
        await this.shopSubmitTransactionService.deleteShopSubmission(submitId, record.shop.id);
        break;
      case SubmitType.NewOperating:
        await this.shopSubmitTransactionService.deleteOperatingHoursSubmission(submitId, record.shopOperatingHour.id);
        break;
      case SubmitType.NewProduct:
        await this.shopSubmitTransactionService.deleteProductSubmission(submitId, record.shop.id);
        break;
      default:
        throw new NotFoundException('Invalid submit type');
    }
  }

  /**
   * type 별로 현재 운영 중인 값과 제보된 값을 나란히 돌려준다. 신규 소품샵은 제보 값이 곧 샵 정보다.
   */
  async findSubmissionsForAdmin(query: GetSubmissionsQueryDto) {
    const order = (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
    const status = query.status ?? SubmitStatus.Pending;

    if (query.type === 'operate') {
      const records = await this.shopSubmitRepository.findAllNewOperatingSubmissions(order, status);

      return records.map((record) => {
        const { shopOperatingHour, shop, ...rest } = record;
        const { operatingHours, ...shopBase } = shop;
        const verifiedOperatingHour = operatingHours?.find((operatingHour) => Boolean(operatingHour.isVerified)) ?? null;

        return {
          ...rest,
          shop: shopBase,
          shopOperatingHour: withNormalizedPhoneNumber(verifiedOperatingHour),
          newShopOperatingHour: withNormalizedPhoneNumber(shopOperatingHour),
        };
      });
    }

    if (query.type === 'product') {
      const records = await this.shopSubmitRepository.findAllNewProductSubmissions(order, status);

      return records.map((record) => {
        const { shopProducts, shop, ...rest } = record;
        const { productMappings, ...shopBase } = shop;

        return {
          ...rest,
          shop: shopBase,
          shopProducts: productMappings?.filter((mapping) => Boolean(mapping.isVerified)).map((mapping) => mapping.product) ?? [],
          newShopProducts: shopProducts?.map((mapping) => mapping.product) ?? [],
        };
      });
    }

    const records = await this.shopSubmitRepository.findAllNewShopSubmissions(order, status);

    return records.map((record) => {
      const { operatingHours, productMappings, ...shopBase } = record.shop;

      return {
        ...record,
        shop: shopBase,
        shopOperatingHour: withNormalizedPhoneNumber(operatingHours?.[0] ?? null),
        shopProducts: productMappings?.map((mapping) => mapping.product) ?? [],
      };
    });
  }

  async acceptProductSubmission(submitId: number): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewProduct);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.acceptProductSubmission(submitId, record.shop.id);
  }

  async rejectProductSubmission(submitId: number, body: RejectSubmissionDto): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewProduct);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.rejectProductSubmission(submitId, body.rejectMessage);
  }

  async acceptOperatingInfoSubmission(submitId: number): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewOperating);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.acceptOperatingInfoSubmission(submitId, record.shop.id);
  }

  async rejectOperatingInfoSubmission(submitId: number, body: RejectSubmissionDto): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewOperating);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.rejectOperatingInfoSubmission(submitId, body.rejectMessage);
  }

  async acceptNewShopSubmission(submitId: number): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewShop);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.acceptNewShopSubmission(submitId, record.shop.id);
  }

  async rejectNewShopSubmission(submitId: number, body: RejectSubmissionDto): Promise<void> {
    const record = await this.shopSubmitRepository.findPendingByIdAndTypeWithShop(submitId, SubmitType.NewShop);
    if (!record) {
      throw new NotFoundException('Not Exist Submission');
    }

    await this.shopSubmitTransactionService.rejectNewShopSubmission(submitId, record.shop.id, body.rejectMessage);
  }
}
