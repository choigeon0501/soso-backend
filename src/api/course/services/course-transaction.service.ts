import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { LoggerService } from '../../../common/logger/logger.service';
import { Course } from '../entities/course.entity';
import { CourseShop } from '../entities/course-shop.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Injectable()
export class CourseTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  async createCourse(uuid: string, name: string, shopIds: number[]): Promise<number> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const course = await manager.getRepository(Course).save({ name, user: { uuid } });
        await manager.getRepository(CourseShop).save(
          shopIds.map((shopId, index) => ({
            course: { id: course.id },
            shop: { id: shopId },
            orderIndex: index + 1,
            visitedAt: null,
          })),
        );

        return course.id;
      });
    } catch (err) {
      this.loggerService.logError('CourseTransaction/ createCourse Error', err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * shopIds가 오면 그 순서가 곧 새 orderIndex(1부터)다. 빠진 샵은 지우고, 남은 샵은 방문 기록을 유지한 채 순서만 바꾼다.
   */
  async updateCourse(courseId: number, name: string | undefined, shopIds: number[] | undefined): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const courseShopRepository = manager.getRepository(CourseShop);

        if (name !== undefined) {
          await manager.getRepository(Course).update({ id: courseId }, { name });
        }

        if (shopIds === undefined) return;

        const existing = await courseShopRepository
          .createQueryBuilder('cs')
          .innerJoin('cs.course', 'course')
          .innerJoinAndSelect('cs.shop', 'shop')
          .where('course.id = :courseId', { courseId })
          .getMany();
        const existingByShopId = new Map<number, CourseShop>();
        for (const courseShop of existing) {
          existingByShopId.set(courseShop.shop.id, courseShop);
        }

        const newShopIdSet = new Set(shopIds);
        const toDeleteIds: number[] = [];
        for (const [existingShopId, courseShop] of existingByShopId) {
          if (!newShopIdSet.has(existingShopId)) {
            toDeleteIds.push(courseShop.id);
          }
        }
        if (toDeleteIds.length > 0) {
          await courseShopRepository.delete({ id: In(toDeleteIds) });
        }

        const toInsert: Partial<CourseShop>[] = [];
        for (let index = 0; index < shopIds.length; index++) {
          const shopId = shopIds[index];
          const newOrderIndex = index + 1;
          const matched = existingByShopId.get(shopId);
          if (!matched) {
            toInsert.push({ course: { id: courseId } as Course, shop: { id: shopId } as Shop, orderIndex: newOrderIndex, visitedAt: null });
          } else if (matched.orderIndex !== newOrderIndex) {
            await courseShopRepository.update({ id: matched.id }, { orderIndex: newOrderIndex });
          }
        }
        if (toInsert.length > 0) {
          await courseShopRepository.save(toInsert);
        }
      });
    } catch (err) {
      this.loggerService.logError('CourseTransaction/ updateCourse Error', err);
      throw new InternalServerErrorException();
    }
  }
}
