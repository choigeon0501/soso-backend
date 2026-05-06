import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CourseRepository } from './repositories/course.repository';
import { CourseTransactionsRepository } from './repositories/course-transactions.repository';
import { ShopRepository } from '../shop/repositories/shop.repository';
import { AwsService } from '../../common/aws/aws.service';
import { CreateCourseDto } from './dto/requests/create-course.dto';
import { UpdateCourseDto } from './dto/requests/update-course.dto';
import { CourseListStatusFilter, GetCourseListQueryDto } from './dto/query/get-course-list-query.dto';
import { CourseListItemDto, GetCourseListResponseDto } from './dto/responses/get-course-list-response.dto';
import { CourseStopDto, GetCourseDetailResponseDto } from './dto/responses/get-course-detail-response.dto';
import { CreateCourseResponseDto, StampResponseDto, UnstampResponseDto } from './dto/responses/stamp-response.dto';
import {
  ImportCourseResponseDto,
  ShareCourseResponseDto,
  SharedCourseResponseDto,
  UploadShareOgImageResponseDto,
} from './dto/responses/share-response.dto';
import { Course } from './entities/course.entity';
import { CourseShop } from './entities/course-shop.entity';

type CourseStatus = 'in_progress' | 'completed';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly courseTransactionsRepository: CourseTransactionsRepository,
    private readonly shopRepository: ShopRepository,
    private readonly awsService: AwsService,
  ) {}

  async getCourseList(uuid: string, query: GetCourseListQueryDto): Promise<GetCourseListResponseDto> {
    const status = query.status ?? 'all';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const allCourses = await this.courseRepository.findCoursesByUuid(uuid);

    const decorated = allCourses.map((course) => {
      const { progress, status: courseStatus } = this.calculateProgress(course.courseShops);
      return { course, progress, courseStatus };
    });

    const filtered = decorated.filter(({ courseStatus }) => {
      if (status === 'all') return true;
      return courseStatus === status;
    });

    filtered.sort((a, b) => {
      const aCompleted = a.courseStatus === 'completed' ? 1 : 0;
      const bCompleted = b.courseStatus === 'completed' ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      return b.course.createdAt.getTime() - a.course.createdAt.getTime();
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const items: CourseListItemDto[] = paged.map(({ course, progress, courseStatus }) => ({
      id: course.id,
      name: course.name,
      createdAt: course.createdAt,
      progress,
      status: courseStatus,
      thumbnails: [...course.courseShops]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((cs) => cs.shop?.mainImage)
        .filter((img): img is string => !!img)
        .slice(0, 4),
    }));

    return { items, total, page, limit };
  }

  async createCourse(uuid: string, dto: CreateCourseDto): Promise<CreateCourseResponseDto> {
    await this.ensureShopsExist(dto.shopIds);

    const courseId = await this.courseTransactionsRepository.createCourse(uuid, dto.name, dto.shopIds);

    return { courseId };
  }

  async getCourseDetail(uuid: string, courseId: number): Promise<GetCourseDetailResponseDto> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    const orderedStops = [...course.courseShops].sort((a, b) => a.orderIndex - b.orderIndex);
    const { progress, status } = this.calculateProgress(orderedStops);

    const stops: CourseStopDto[] = orderedStops.map((cs) => ({
      shopId: cs.shop.id,
      orderIndex: cs.orderIndex,
      visitedAt: cs.visitedAt,
      shop: {
        id: cs.shop.id,
        name: cs.shop.name,
        mainImage: cs.shop.mainImage ?? null,
        lat: Number(cs.shop.lat),
        lng: Number(cs.shop.lng),
        isHidden: cs.shop.isHidden,
        instagram: cs.shop.instagram ?? null,
      },
    }));

    return {
      id: course.id,
      name: course.name,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      progress,
      status,
      stops,
    };
  }

  async updateCourse(uuid: string, courseId: number, dto: UpdateCourseDto): Promise<void> {
    if (dto.name === undefined && dto.shopIds === undefined) {
      throw new BadRequestException('수정할 내용이 없습니다.');
    }

    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    if (dto.shopIds !== undefined) {
      await this.ensureShopsExist(dto.shopIds);
    }

    await this.courseTransactionsRepository.updateCourse(courseId, dto.name, dto.shopIds);
  }

  async deleteCourse(uuid: string, courseId: number): Promise<void> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    await this.courseRepository.deleteCourseById(courseId);
  }

  async stamp(uuid: string, courseId: number, shopId: number): Promise<StampResponseDto> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    const target = course.courseShops.find((cs) => cs.shop.id === shopId);
    if (!target) {
      throw new NotFoundException('해당 소품샵이 코스에 포함되어 있지 않습니다.');
    }

    const now = new Date();
    await this.courseRepository.updateVisitedAt(target.id, now);

    const updatedShops = course.courseShops.map((cs) =>
      cs.id === target.id ? { ...cs, visitedAt: now } : cs,
    ) as CourseShop[];
    const { progress, status } = this.calculateProgress(updatedShops);

    return { visitedAt: now, progress, status };
  }

  async unstamp(uuid: string, courseId: number, shopId: number): Promise<UnstampResponseDto> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    const target = course.courseShops.find((cs) => cs.shop.id === shopId);
    if (!target) {
      throw new NotFoundException('해당 소품샵이 코스에 포함되어 있지 않습니다.');
    }

    await this.courseRepository.updateVisitedAt(target.id, null);

    const updatedShops = course.courseShops.map((cs) =>
      cs.id === target.id ? { ...cs, visitedAt: null } : cs,
    ) as CourseShop[];
    const { progress, status } = this.calculateProgress(updatedShops);

    return { progress, status };
  }

  async generateShareToken(uuid: string, courseId: number): Promise<ShareCourseResponseDto> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    if (course.shareToken) {
      return { shareToken: course.shareToken };
    }

    const token = randomBytes(24).toString('base64url');
    await this.courseRepository.updateShareToken(courseId, token);

    return { shareToken: token };
  }

  async revokeShareToken(uuid: string, courseId: number): Promise<void> {
    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    await this.courseRepository.updateShareToken(courseId, null);
  }

  async getSharedCourse(token: string): Promise<SharedCourseResponseDto> {
    const course = await this.courseRepository.findByShareToken(token);
    if (!course) {
      throw new NotFoundException('공유된 코스를 찾을 수 없습니다.');
    }

    const visibleStops = [...course.courseShops]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .filter((cs) => cs.shop && !cs.shop.isHidden);

    const stops = visibleStops.map((cs) => ({
      orderIndex: cs.orderIndex,
      shop: {
        id: cs.shop.id,
        name: cs.shop.name,
        mainImage: cs.shop.mainImage ?? null,
        lat: Number(cs.shop.lat),
        lng: Number(cs.shop.lng),
        instagram: cs.shop.instagram ?? null,
      },
    }));

    return {
      name: course.name,
      ownerNickname: course.user?.nickName ?? null,
      ownerProfileImg: course.user?.profileImg ?? null,
      ogImageUrl: course.ogImageUrl ?? null,
      totalStops: stops.length,
      stops,
    };
  }

  async uploadShareOgImage(uuid: string, courseId: number, file: Express.Multer.File): Promise<UploadShareOgImageResponseDto> {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    const course = await this.courseRepository.findCourseByIdWithOwner(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    this.assertOwnership(course, uuid);

    const [ogImageUrl] = await this.awsService.uploadImagesToS3(file, 'course-share-og');
    // 이미 코스에 og 이미지가 존재하는 경우 제거 후 업데이트
    if (course.ogImageUrl) {
      await this.awsService.deleteImageFromS3(course.ogImageUrl);
    }
    await this.courseRepository.updateOgImageUrl(courseId, ogImageUrl);

    return { ogImageUrl };
  }

  async importSharedCourse(uuid: string, token: string): Promise<ImportCourseResponseDto> {
    const course = await this.courseRepository.findByShareToken(token);
    if (!course) {
      throw new NotFoundException('공유된 코스를 찾을 수 없습니다.');
    }

    const visibleShopIds = [...course.courseShops]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .filter((cs) => cs.shop && !cs.shop.isHidden)
      .map((cs) => cs.shop.id);

    if (visibleShopIds.length < 2) {
      throw new BadRequestException('복제 가능한 소품샵이 2개 미만이어서 코스를 가져올 수 없습니다.');
    }

    const courseId = await this.courseTransactionsRepository.createCourse(uuid, course.name, visibleShopIds);

    return { courseId };
  }

  private assertOwnership(course: Course, uuid: string): void {
    if (!course.user || course.user.uuid !== uuid) {
      throw new ForbiddenException('해당 코스에 접근할 권한이 없습니다.');
    }
  }

  private calculateProgress(courseShops: CourseShop[]): { progress: number; status: CourseStatus } {
    const total = courseShops.length;
    if (total === 0) {
      return { progress: 0, status: 'in_progress' };
    }

    const visited = courseShops.filter((cs) => cs.visitedAt !== null && cs.visitedAt !== undefined).length;
    const progress = Math.round((visited / total) * 100);
    const status: CourseStatus = progress === 100 ? 'completed' : 'in_progress';

    return { progress, status };
  }

  private async ensureShopsExist(shopIds: number[]): Promise<void> {
    const uniqueIds = Array.from(new Set(shopIds));

    const results = await Promise.all(uniqueIds.map((id) => this.shopRepository.findByShopIdForHiddenShop(id)));
    const missing = uniqueIds.filter((_, idx) => !results[idx]);
    if (missing.length > 0) {
      throw new NotFoundException(`존재하지 않는 소품샵이 포함되어 있습니다: ${missing.join(', ')}`);
    }
  }
}
