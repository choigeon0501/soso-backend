import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CourseShop } from '../entities/course-shop.entity';

@Injectable()
export class CourseRepository {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseShop)
    private readonly courseShopRepo: Repository<CourseShop>,
  ) {}

  async findCoursesByUuid(uuid: string): Promise<Course[]> {
    return this.courseRepo.find({
      where: { user: { uuid } },
      relations: ['courseShops', 'courseShops.shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCourseByIdWithOwner(courseId: number): Promise<Course | null> {
    return this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.user', 'user')
      .leftJoinAndSelect('course.courseShops', 'courseShops')
      .leftJoinAndSelect('courseShops.shop', 'shop')
      .where('course.id = :courseId', { courseId })
      .orderBy('courseShops.orderIndex', 'ASC')
      .getOne();
  }

  async findCourseShop(courseId: number, shopId: number): Promise<CourseShop | null> {
    return this.courseShopRepo
      .createQueryBuilder('cs')
      .innerJoin('cs.course', 'course')
      .innerJoin('cs.shop', 'shop')
      .where('course.id = :courseId', { courseId })
      .andWhere('shop.id = :shopId', { shopId })
      .getOne();
  }

  async findVisitedCourseShopsByUuid(uuid: string): Promise<CourseShop[]> {
    return this.courseShopRepo
      .createQueryBuilder('cs')
      .innerJoin('cs.course', 'course')
      .innerJoin('course.user', 'user')
      .innerJoinAndSelect('cs.shop', 'shop')
      .where('user.uuid = :uuid', { uuid })
      .andWhere('cs.visitedAt IS NOT NULL')
      .orderBy('cs.visitedAt', 'DESC')
      .getMany();
  }

  async findCourseShopsByCourseId(courseId: number): Promise<CourseShop[]> {
    return this.courseShopRepo
      .createQueryBuilder('cs')
      .innerJoin('cs.course', 'course')
      .innerJoinAndSelect('cs.shop', 'shop')
      .where('course.id = :courseId', { courseId })
      .orderBy('cs.orderIndex', 'ASC')
      .getMany();
  }

  async updateVisitedAt(courseShopId: number, visitedAt: Date | null): Promise<void> {
    await this.courseShopRepo.update({ id: courseShopId }, { visitedAt });
  }

  async deleteCourseById(courseId: number): Promise<void> {
    await this.courseRepo.delete({ id: courseId });
  }

  async findByShareToken(token: string): Promise<Course | null> {
    return this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.user', 'user')
      .leftJoinAndSelect('course.courseShops', 'courseShops')
      .leftJoinAndSelect('courseShops.shop', 'shop')
      .where('course.shareToken = :token', { token })
      .orderBy('courseShops.orderIndex', 'ASC')
      .getOne();
  }

  async updateShareToken(courseId: number, token: string | null): Promise<void> {
    await this.courseRepo.update({ id: courseId }, { shareToken: token });
  }

  async updateOgImageUrl(courseId: number, ogImageUrl: string | null): Promise<void> {
    await this.courseRepo.update({ id: courseId }, { ogImageUrl });
  }
}
