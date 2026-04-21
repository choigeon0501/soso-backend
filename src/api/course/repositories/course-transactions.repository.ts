import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CourseShop } from '../entities/course-shop.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Injectable()
export class CourseTransactionsRepository {
  constructor(private dataSource: DataSource) {}

  async createCourse(uuid: string, name: string, shopIds: number[]): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const courseRepo = queryRunner.manager.getRepository(Course);
      const courseShopRepo = queryRunner.manager.getRepository(CourseShop);

      const course = await courseRepo.save({
        name,
        user: { uuid },
      });

      const courseShops = shopIds.map((shopId, index) => ({
        course: { id: course.id },
        shop: { id: shopId },
        orderIndex: index + 1,
        visitedAt: null,
      }));
      await courseShopRepo.save(courseShops);

      await queryRunner.commitTransaction();
      return course.id;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async updateCourse(courseId: number, name: string | undefined, shopIds: number[] | undefined): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const courseRepo = queryRunner.manager.getRepository(Course);
      const courseShopRepo = queryRunner.manager.getRepository(CourseShop);

      if (name !== undefined) {
        await courseRepo.update({ id: courseId }, { name });
      }

      if (shopIds !== undefined) {
        const existing = await courseShopRepo
          .createQueryBuilder('cs')
          .innerJoin('cs.course', 'course')
          .innerJoinAndSelect('cs.shop', 'shop')
          .where('course.id = :courseId', { courseId })
          .getMany();

        const existingByShopId = new Map<number, CourseShop>();
        for (const cs of existing) {
          existingByShopId.set(cs.shop.id, cs);
        }

        const newShopIdSet = new Set(shopIds);

        const toDeleteIds: number[] = [];
        for (const [existingShopId, cs] of existingByShopId) {
          if (!newShopIdSet.has(existingShopId)) {
            toDeleteIds.push(cs.id);
          }
        }
        if (toDeleteIds.length > 0) {
          await courseShopRepo.delete({ id: In(toDeleteIds) });
        }

        const toInsert: Partial<CourseShop>[] = [];
        for (let index = 0; index < shopIds.length; index++) {
          const shopId = shopIds[index];
          const newOrderIndex = index + 1;
          const matched = existingByShopId.get(shopId);
          if (matched) {
            if (matched.orderIndex !== newOrderIndex) {
              await courseShopRepo.update({ id: matched.id }, { orderIndex: newOrderIndex });
            }
          } else {
            toInsert.push({
              course: { id: courseId } as Course,
              shop: { id: shopId } as Shop,
              orderIndex: newOrderIndex,
              visitedAt: null,
            });
          }
        }
        if (toInsert.length > 0) {
          await courseShopRepo.save(toInsert);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
