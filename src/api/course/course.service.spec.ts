import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseRepository } from './repositories/course.repository';
import { CourseTransactionsRepository } from './repositories/course-transactions.repository';
import { ShopRepository } from '../shop/repositories/shop.repository';
import { Course } from './entities/course.entity';
import { CourseShop } from './entities/course-shop.entity';
import { Shop } from '../shop/entities/shop.entity';

type MockRepo<T> = { [K in keyof T]: jest.Mock };

function makeShop(partial: Partial<Shop>): Shop {
  return {
    id: 0,
    name: 'shop',
    mainImage: null,
    isVerified: true,
    instagram: null,
    lat: 37.5 as unknown as number,
    lng: 127 as unknown as number,
    location: '서울',
    isHidden: false,
    region: undefined as any,
    operatingHours: [],
    productMappings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

function makeCourseShop(id: number, shop: Shop, orderIndex: number, visitedAt: Date | null = null): CourseShop {
  return { id, shop, orderIndex, visitedAt, course: undefined as any };
}

function makeCourse(
  id: number,
  uuid: string,
  createdAt: Date,
  courseShops: CourseShop[],
  name = 'test',
  extras: { shareToken?: string | null; nickName?: string | null } = {},
): Course {
  return {
    id,
    name,
    user: { uuid, nickName: extras.nickName ?? null } as any,
    shareToken: extras.shareToken ?? null,
    courseShops,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('CourseService', () => {
  let service: CourseService;
  let courseRepo: MockRepo<CourseRepository>;
  let txRepo: MockRepo<CourseTransactionsRepository>;
  let shopRepo: MockRepo<ShopRepository>;

  const OWNER = 'owner-uuid';
  const STRANGER = 'other-uuid';

  beforeEach(() => {
    courseRepo = {
      findCoursesByUuid: jest.fn(),
      findCourseByIdWithOwner: jest.fn(),
      findCourseShop: jest.fn(),
      findCourseShopsByCourseId: jest.fn(),
      updateVisitedAt: jest.fn(),
      deleteCourseById: jest.fn(),
      findByShareToken: jest.fn(),
      updateShareToken: jest.fn(),
    } as any;

    txRepo = {
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
    } as any;

    shopRepo = {
      findByShopIdForHiddenShop: jest.fn(),
    } as any;

    service = new CourseService(courseRepo as any, txRepo as any, shopRepo as any);
  });

  // ==================== progress 계산 (getCourseDetail로 간접 검증) ====================
  describe('progress 계산', () => {
    it('미방문 샵만 있으면 0% / in_progress', async () => {
      const shopA = makeShop({ id: 1 });
      const shopB = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, shopA, 1, null), makeCourseShop(2, shopB, 2, null)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const detail = await service.getCourseDetail(OWNER, 10);

      expect(detail.progress).toBe(0);
      expect(detail.status).toBe('in_progress');
    });

    it('일부 방문 시 반올림 progress + in_progress', async () => {
      const shopA = makeShop({ id: 1 });
      const shopB = makeShop({ id: 2 });
      const shopC = makeShop({ id: 3 });
      const course = makeCourse(10, OWNER, new Date(), [
        makeCourseShop(1, shopA, 1, new Date()),
        makeCourseShop(2, shopB, 2, null),
        makeCourseShop(3, shopC, 3, null),
      ]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const detail = await service.getCourseDetail(OWNER, 10);

      expect(detail.progress).toBe(33);
      expect(detail.status).toBe('in_progress');
    });

    it('전부 방문 시 100% / completed', async () => {
      const now = new Date();
      const shopA = makeShop({ id: 1 });
      const shopB = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, shopA, 1, now), makeCourseShop(2, shopB, 2, now)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const detail = await service.getCourseDetail(OWNER, 10);

      expect(detail.progress).toBe(100);
      expect(detail.status).toBe('completed');
    });
  });

  // ==================== getCourseDetail ====================
  describe('getCourseDetail', () => {
    it('존재하지 않으면 NotFoundException', async () => {
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(null);
      await expect(service.getCourseDetail(OWNER, 99)).rejects.toThrow(NotFoundException);
    });

    it('다른 사용자의 코스면 ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.getCourseDetail(STRANGER, 10)).rejects.toThrow(ForbiddenException);
    });

    it('is_hidden=true 샵도 stops에 그대로 포함되며 isHidden=true로 반환', async () => {
      const hiddenShop = makeShop({ id: 5, isHidden: true, name: '숨김샵' });
      const normalShop = makeShop({ id: 6, isHidden: false, name: '노출샵' });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, hiddenShop, 1, null), makeCourseShop(2, normalShop, 2, null)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const detail = await service.getCourseDetail(OWNER, 10);

      expect(detail.stops).toHaveLength(2);
      expect(detail.stops[0].shop.isHidden).toBe(true);
      expect(detail.stops[1].shop.isHidden).toBe(false);
    });

    it('stops는 orderIndex 오름차순 정렬', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const s3 = makeShop({ id: 3 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(3, s3, 3), makeCourseShop(1, s1, 1), makeCourseShop(2, s2, 2)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const detail = await service.getCourseDetail(OWNER, 10);

      expect(detail.stops.map((s) => s.orderIndex)).toEqual([1, 2, 3]);
      expect(detail.stops.map((s) => s.shopId)).toEqual([1, 2, 3]);
    });
  });

  // ==================== getCourseList ====================
  describe('getCourseList', () => {
    it('진행 중이 완료보다 먼저, 각 그룹 내에서 최신순', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const now = new Date('2026-04-20T12:00:00Z');
      const older = new Date('2026-04-10T12:00:00Z');
      const middle = new Date('2026-04-15T12:00:00Z');

      const completed = makeCourse(1, OWNER, now, [makeCourseShop(1, s1, 1, now), makeCourseShop(2, s2, 2, now)], 'C');
      const inProgressOld = makeCourse(2, OWNER, older, [makeCourseShop(3, s1, 1, null), makeCourseShop(4, s2, 2, null)], 'A');
      const inProgressNew = makeCourse(3, OWNER, middle, [makeCourseShop(5, s1, 1, null), makeCourseShop(6, s2, 2, null)], 'B');

      courseRepo.findCoursesByUuid.mockResolvedValue([completed, inProgressOld, inProgressNew]);

      const res = await service.getCourseList(OWNER, { status: 'all', page: 1, limit: 10 });

      expect(res.items.map((i) => i.id)).toEqual([3, 2, 1]);
      expect(res.items[0].status).toBe('in_progress');
      expect(res.items[2].status).toBe('completed');
      expect(res.total).toBe(3);
    });

    it('status=completed 필터', async () => {
      const s1 = makeShop({ id: 1 });
      const now = new Date();
      const completed = makeCourse(1, OWNER, now, [makeCourseShop(1, s1, 1, now)]);
      const inProgress = makeCourse(2, OWNER, now, [makeCourseShop(2, s1, 1, null)]);

      courseRepo.findCoursesByUuid.mockResolvedValue([completed, inProgress]);

      const res = await service.getCourseList(OWNER, { status: 'completed', page: 1, limit: 10 });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe(1);
      expect(res.total).toBe(1);
    });

    it('thumbnails는 orderIndex 순 최대 4개 + mainImage null 제외', async () => {
      const s1 = makeShop({ id: 1, mainImage: 'a.jpg' });
      const s2 = makeShop({ id: 2, mainImage: null });
      const s3 = makeShop({ id: 3, mainImage: 'c.jpg' });
      const s4 = makeShop({ id: 4, mainImage: 'd.jpg' });
      const s5 = makeShop({ id: 5, mainImage: 'e.jpg' });
      const s6 = makeShop({ id: 6, mainImage: 'f.jpg' });
      const course = makeCourse(1, OWNER, new Date(), [
        makeCourseShop(1, s1, 1),
        makeCourseShop(2, s2, 2),
        makeCourseShop(3, s3, 3),
        makeCourseShop(4, s4, 4),
        makeCourseShop(5, s5, 5),
        makeCourseShop(6, s6, 6),
      ]);
      courseRepo.findCoursesByUuid.mockResolvedValue([course]);

      const res = await service.getCourseList(OWNER, { status: 'all', page: 1, limit: 10 });

      expect(res.items[0].thumbnails).toEqual(['a.jpg', 'c.jpg', 'd.jpg', 'e.jpg']);
    });

    it('페이지네이션 — 2페이지 limit=2', async () => {
      const s1 = makeShop({ id: 1 });
      const courses = [1, 2, 3, 4, 5].map((id) => makeCourse(id, OWNER, new Date(Date.now() - (5 - id) * 1000), [makeCourseShop(id, s1, 1)]));
      courseRepo.findCoursesByUuid.mockResolvedValue(courses);

      const page2 = await service.getCourseList(OWNER, { status: 'all', page: 2, limit: 2 });

      expect(page2.items).toHaveLength(2);
      expect(page2.total).toBe(5);
      expect(page2.page).toBe(2);
    });
  });

  // ==================== createCourse ====================
  describe('createCourse', () => {
    it('모든 shopId가 존재하면 생성 성공 + courseId 반환', async () => {
      shopRepo.findByShopIdForHiddenShop.mockImplementation(async (id: number) => makeShop({ id }));
      txRepo.createCourse.mockResolvedValue(42);

      const res = await service.createCourse(OWNER, { name: '코스', shopIds: [1, 2, 3] });

      expect(res).toEqual({ courseId: 42 });
      expect(txRepo.createCourse).toHaveBeenCalledWith(OWNER, '코스', [1, 2, 3]);
    });

    it('shopId 중 하나라도 없으면 NotFoundException + tx 호출 안 함', async () => {
      shopRepo.findByShopIdForHiddenShop.mockImplementation(async (id: number) => (id === 99 ? null : makeShop({ id })));

      await expect(service.createCourse(OWNER, { name: '코스', shopIds: [1, 99] })).rejects.toThrow(NotFoundException);
      expect(txRepo.createCourse).not.toHaveBeenCalled();
    });
  });

  // ==================== updateCourse ====================
  describe('updateCourse', () => {
    it('name/shopIds 둘 다 undefined면 BadRequestException', async () => {
      await expect(service.updateCourse(OWNER, 10, {})).rejects.toThrow(BadRequestException);
    });

    it('코스 없으면 NotFoundException', async () => {
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(null);
      await expect(service.updateCourse(OWNER, 10, { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('남의 코스 → ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.updateCourse(STRANGER, 10, { name: 'x' })).rejects.toThrow(ForbiddenException);
    });

    it('정상 수정 시 tx.updateCourse 호출', async () => {
      const s1 = makeShop({ id: 1 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      shopRepo.findByShopIdForHiddenShop.mockImplementation(async (id: number) => makeShop({ id }));
      txRepo.updateCourse.mockResolvedValue(undefined);

      await service.updateCourse(OWNER, 10, { name: '새이름', shopIds: [1, 2] });

      expect(txRepo.updateCourse).toHaveBeenCalledWith(10, '새이름', [1, 2]);
    });

    it('shopIds 내 존재하지 않는 ID 포함 시 NotFoundException + tx 호출 안 함', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      shopRepo.findByShopIdForHiddenShop.mockImplementation(async (id: number) => (id === 99 ? null : makeShop({ id })));

      await expect(service.updateCourse(OWNER, 10, { shopIds: [1, 99] })).rejects.toThrow(NotFoundException);
      expect(txRepo.updateCourse).not.toHaveBeenCalled();
    });
  });

  // ==================== deleteCourse ====================
  describe('deleteCourse', () => {
    it('코스 없으면 NotFoundException', async () => {
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(null);
      await expect(service.deleteCourse(OWNER, 10)).rejects.toThrow(NotFoundException);
    });

    it('남의 코스 → ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.deleteCourse(STRANGER, 10)).rejects.toThrow(ForbiddenException);
      expect(courseRepo.deleteCourseById).not.toHaveBeenCalled();
    });

    it('정상 삭제', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await service.deleteCourse(OWNER, 10);
      expect(courseRepo.deleteCourseById).toHaveBeenCalledWith(10);
    });
  });

  // ==================== stamp / unstamp ====================
  describe('stamp', () => {
    it('해당 shop이 코스에 없으면 NotFoundException', async () => {
      const s1 = makeShop({ id: 1 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1, null)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      await expect(service.stamp(OWNER, 10, 999)).rejects.toThrow(NotFoundException);
      expect(courseRepo.updateVisitedAt).not.toHaveBeenCalled();
    });

    it('정상 stamp → visitedAt=now + progress 재계산', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1, null), makeCourseShop(2, s2, 2, null)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.stamp(OWNER, 10, 1);

      expect(res.progress).toBe(50);
      expect(res.status).toBe('in_progress');
      expect(res.visitedAt).toBeInstanceOf(Date);
      expect(courseRepo.updateVisitedAt).toHaveBeenCalledWith(1, expect.any(Date));
    });

    it('마지막 샵 stamp → 100% / completed', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1, new Date()), makeCourseShop(2, s2, 2, null)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.stamp(OWNER, 10, 2);

      expect(res.progress).toBe(100);
      expect(res.status).toBe('completed');
    });

    it('남의 코스 stamp → ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.stamp(STRANGER, 10, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unstamp', () => {
    it('정상 unstamp → visitedAt=null + progress 재계산', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1, new Date()), makeCourseShop(2, s2, 2, new Date())]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.unstamp(OWNER, 10, 1);

      expect(res.progress).toBe(50);
      expect(res.status).toBe('in_progress');
      expect(courseRepo.updateVisitedAt).toHaveBeenCalledWith(1, null);
    });

    it('100% → unstamp → in_progress 복귀', async () => {
      const now = new Date();
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2 });
      const course = makeCourse(10, OWNER, new Date(), [makeCourseShop(1, s1, 1, now), makeCourseShop(2, s2, 2, now)]);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.unstamp(OWNER, 10, 1);

      expect(res.progress).toBe(50);
      expect(res.status).toBe('in_progress');
    });
  });

  // ==================== share 기능 ====================
  describe('generateShareToken', () => {
    it('토큰이 없는 경우 새로 생성하고 DB에 저장', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.generateShareToken(OWNER, 10);

      expect(res.shareToken).toEqual(expect.any(String));
      expect(res.shareToken.length).toBeGreaterThanOrEqual(20);
      expect(courseRepo.updateShareToken).toHaveBeenCalledWith(10, res.shareToken);
    });

    it('기존 토큰이 있으면 재사용 (멱등) — updateShareToken 호출 안 함', async () => {
      const course = makeCourse(10, OWNER, new Date(), [], 'test', { shareToken: 'existing-token-abc' });
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      const res = await service.generateShareToken(OWNER, 10);

      expect(res.shareToken).toBe('existing-token-abc');
      expect(courseRepo.updateShareToken).not.toHaveBeenCalled();
    });

    it('코스 없으면 NotFoundException', async () => {
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(null);
      await expect(service.generateShareToken(OWNER, 99)).rejects.toThrow(NotFoundException);
    });

    it('다른 유저의 코스 → ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.generateShareToken(STRANGER, 10)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revokeShareToken', () => {
    it('본인 코스 → shareToken을 null로 업데이트', async () => {
      const course = makeCourse(10, OWNER, new Date(), [], 'test', { shareToken: 'abc' });
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);

      await service.revokeShareToken(OWNER, 10);

      expect(courseRepo.updateShareToken).toHaveBeenCalledWith(10, null);
    });

    it('남의 코스 → ForbiddenException', async () => {
      const course = makeCourse(10, OWNER, new Date(), []);
      courseRepo.findCourseByIdWithOwner.mockResolvedValue(course);
      await expect(service.revokeShareToken(STRANGER, 10)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSharedCourse', () => {
    it('유효한 토큰 → 이름/닉네임/stops 반환, visited_at은 포함하지 않음', async () => {
      const s1 = makeShop({ id: 1, name: 'A' });
      const s2 = makeShop({ id: 2, name: 'B' });
      const course = makeCourse(
        10,
        OWNER,
        new Date(),
        [makeCourseShop(1, s1, 1, new Date()), makeCourseShop(2, s2, 2)],
        '성수 데이트',
        { shareToken: 'tok-1', nickName: 'owner-nick' },
      );
      courseRepo.findByShareToken.mockResolvedValue(course);

      const res = await service.getSharedCourse('tok-1');

      expect(res.name).toBe('성수 데이트');
      expect(res.ownerNickname).toBe('owner-nick');
      expect(res.totalStops).toBe(2);
      expect(res.stops.map((s) => s.orderIndex)).toEqual([1, 2]);
      expect(res.stops.map((s) => s.shop.name)).toEqual(['A', 'B']);
      // visited_at 필드는 응답에 없음을 보장
      expect((res.stops[0] as any).visitedAt).toBeUndefined();
    });

    it('is_hidden 샵은 stops에서 제외', async () => {
      const s1 = makeShop({ id: 1, isHidden: false });
      const s2 = makeShop({ id: 2, isHidden: true });
      const s3 = makeShop({ id: 3, isHidden: false });
      const course = makeCourse(
        10,
        OWNER,
        new Date(),
        [makeCourseShop(1, s1, 1), makeCourseShop(2, s2, 2), makeCourseShop(3, s3, 3)],
        'x',
        { shareToken: 'tok-2' },
      );
      courseRepo.findByShareToken.mockResolvedValue(course);

      const res = await service.getSharedCourse('tok-2');

      expect(res.totalStops).toBe(2);
      expect(res.stops.map((s) => s.shop.id)).toEqual([1, 3]);
    });

    it('존재하지 않는 토큰 → NotFoundException', async () => {
      courseRepo.findByShareToken.mockResolvedValue(null);
      await expect(service.getSharedCourse('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('importSharedCourse', () => {
    it('유효한 토큰 → 새 코스 생성, visited_at=null, 숨김 샵 제외', async () => {
      const s1 = makeShop({ id: 1 });
      const s2 = makeShop({ id: 2, isHidden: true }); // 숨김 → 제외
      const s3 = makeShop({ id: 3 });
      const source = makeCourse(
        10,
        OWNER,
        new Date(),
        [makeCourseShop(1, s1, 1, new Date()), makeCourseShop(2, s2, 2), makeCourseShop(3, s3, 3)],
        '원본 코스',
        { shareToken: 'tok-import' },
      );
      courseRepo.findByShareToken.mockResolvedValue(source);
      txRepo.createCourse.mockResolvedValue(99);

      const res = await service.importSharedCourse(STRANGER, 'tok-import');

      expect(res).toEqual({ courseId: 99 });
      expect(txRepo.createCourse).toHaveBeenCalledWith(STRANGER, '원본 코스', [1, 3]);
    });

    it('공유된 코스에서 보이는 샵이 2개 미만이면 BadRequestException', async () => {
      const s1 = makeShop({ id: 1, isHidden: true });
      const s2 = makeShop({ id: 2, isHidden: true });
      const source = makeCourse(
        10,
        OWNER,
        new Date(),
        [makeCourseShop(1, s1, 1), makeCourseShop(2, s2, 2)],
        'x',
        { shareToken: 'tok-few' },
      );
      courseRepo.findByShareToken.mockResolvedValue(source);

      await expect(service.importSharedCourse(STRANGER, 'tok-few')).rejects.toThrow(BadRequestException);
      expect(txRepo.createCourse).not.toHaveBeenCalled();
    });

    it('존재하지 않는 토큰 → NotFoundException', async () => {
      courseRepo.findByShareToken.mockResolvedValue(null);
      await expect(service.importSharedCourse(STRANGER, 'nope')).rejects.toThrow(NotFoundException);
    });
  });
});
