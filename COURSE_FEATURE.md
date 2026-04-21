# 코스(Course) 기능 추가 구현 가이드

> **참고**: 본 문서는 기획·설계 레퍼런스 용입니다. 실제 프로젝트 컨벤션과 차이가 있는 아래 항목은 `~/.claude/plans/course-fancy-zebra.md` 계획을 따릅니다.
> - DTO 하위 폴더명: `request/` → **`requests/`**, `response/` → **`responses/`**, `query/`는 그대로 (기존 프로젝트 실제 구조)
> - 엔티티 PK 타입: `bigint` → **`int`** (`@PrimaryGeneratedColumn()`, 기존 Shop/User와 일관)
> - 사용자 확정 결정: 숨김 샵은 stops에 그대로 포함 + `isHidden` 필드 / 수정 시 `visited_at` 보존은 A안 delta / 브랜치 `feat/course`

> `PROJECT_OVERVIEW.md`와 `CLAUDE.md`를 먼저 읽은 상태에서 이 문서를 따라 작업한다.
> 기준일: 2026-04-20

---

## 0. 이 문서의 목적

새롭게 **"코스(Course)"** 도메인 모듈을 `src/api/course/`에 추가하기 위한 구현 가이드입니다.
기획·DB 스키마·API 스펙·비즈니스 규칙·폴더 구조·테스트 포인트를 모두 포함하며, 이 문서만 보고도 기존 프로젝트 컨벤션에 맞춰 구현을 완료할 수 있도록 작성했습니다.

---

## 1. 기능 개요

### 1.1 한 줄 정의
사용자가 찜한 소품샵들을 묶어 **"나만의 방문 코스"**를 만들고, 지도에서 실제로 방문하며 **"도장 깨기"** 방식으로 진행 상황을 기록·공유하는 기능.

### 1.2 핵심 컨셉
- **소품샵 도장깨기**: 여행 스탬프 랠리처럼, 유저가 만든 코스의 각 소품샵을 하나씩 방문하며 도장을 찍어 100% 완료를 향해 진행
- 진행률 표시 (74% 진행 중 / 100% 완료)
- 개인 코스만 존재 (현 단계에선 타인에게 공유받는 기능 없음. 공유는 OS 공유시트 수준)

### 1.3 주요 사용자 플로우

1. **코스 메인 진입** — 하단 탭바의 "코스" 탭 → 내 코스 목록(전체/진행중/완료)
2. **코스 생성 Step1** — 소품샵 선택 (찜 리스트 기반, 검색 가능, 최소 2개~최대 30개)
3. **코스 생성 Step2** — 순서 드래그 편집 + 코스 이름 지정 → 저장
4. **코스 상세** — 상단 스텝퍼 + 지도 + 하단 소품샵 카드 → 각 샵에서 "도장 찍기"/"도장 취소"
5. **코스 수정/삭제** — 상세에서 "..." 메뉴 → 수정(Step2와 동일 화면) / 삭제(확인 팝업)

### 1.4 비즈니스 규칙 요약

| # | 규칙 |
|---|---|
| R1 | 코스 하나는 **최소 2개, 최대 30개**의 소품샵을 포함한다 |
| R2 | 같은 코스 안에 **같은 소품샵 중복 불가** |
| R3 | 코스 이름은 **최대 30자** |
| R4 | 코스/도장 기능은 **로그인 유저만** 가능 (JwtAuthGuard 필수) |
| R5 | 타 유저의 코스는 조회·수정·삭제 불가 (본인 소유 검증 필수) |
| R6 | 진행률·상태는 DB에 저장하지 않고 **조회 시 계산** |
| R7 | `is_hidden = true` 소품샵도 코스에 남아있을 수 있으며, 조회 시 그 상태 그대로 내려줌 (프론트에서 표시 분기) |
| R8 | 방문 완료한 샵도 도장 취소 가능 (100% 완료 → 진행 중으로 되돌릴 수 있음) |

---

## 2. 데이터 모델

### 2.1 엔티티 개요

2개의 새 엔티티를 `src/api/course/entities/`에 추가한다.

```
Course (1) ────< CourseShop (N) >──── Shop (1)
                 (매핑 + 방문 정보)
```

### 2.2 `courses` 테이블 — `Course` 엔티티

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | int | PK, AUTO_INCREMENT | (※ 기존 프로젝트 컨벤션에 맞춰 int) |
| `uuid` | char(36) | FK → users.uuid, **CASCADE** | 소유자 |
| `name` | varchar(30) | NOT NULL | 코스 이름 (최대 30자) |
| `created_at` | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | timestamp | NOT NULL, ON UPDATE | |

**관계**:
- `User` N:1 (CASCADE) — 유저 탈퇴 시 코스도 함께 삭제
- `CourseShop` 1:N (CASCADE)

**인덱스**:
- `INDEX (uuid, created_at)` — "내 코스 목록" 조회 성능용

### 2.3 `course_shops` 테이블 — `CourseShop` 엔티티

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | int | PK, AUTO_INCREMENT | |
| `course_id` | int | FK → courses.id, **CASCADE** | |
| `shop_id` | int | FK → shops.id, **RESTRICT** | Shop은 DB 삭제 대신 is_hidden으로 관리되므로 RESTRICT가 안전 |
| `order_index` | int | NOT NULL | 코스 내 순서 (1부터 시작) |
| `visited_at` | timestamp | **NULL** 허용 | null = 미방문, 값 있음 = 해당 시각에 방문 완료 |
| UNIQUE | `(course_id, shop_id)` | | 같은 코스에 같은 샵 중복 방지 (R2) |

**관계**:
- `Course` N:1 (CASCADE)
- `Shop` N:1 (RESTRICT)

**인덱스**:
- UNIQUE `(course_id, shop_id)` (@Unique 데코레이터)
- `INDEX (course_id, order_index)` — 정렬된 조회 성능용

### 2.4 중요한 설계 결정 — "왜 이렇게?"

#### ❌ 하지 말 것: `is_visited(boolean) + completed_at(timestamp)` 이중 저장
- boolean과 timestamp가 불일치할 수 있음 (데이터 오염)
- **`visited_at` timestamp 하나로 통합**하는 것이 정답 (기존 프로젝트의 `last_activity_at`, `ban_start_at` 패턴과 일관)

#### ❌ 하지 말 것: `progress %`, `status` 컬럼을 `courses`에 저장
- 도장 찍을 때마다 `courses` 테이블도 UPDATE → 불필요한 쓰기
- 계산 비용이 거의 0 (최대 30개)이므로 **조회 시 계산**하는 게 맞음
- 공식:
  ```
  progress = round((visited_count / total_count) * 100)
  status   = progress === 100 ? 'completed' : 'in_progress'
  ```

#### ⚠️ `shop_id` RESTRICT 이유
- 이 프로젝트는 `Shop.is_hidden`로 soft delete 하므로 실제 DELETE는 거의 발생하지 않음
- 혹시라도 실제 DELETE가 시도되면 코스에 참조가 남아있을 때 DB 차원에서 막아주는 안전장치

---

## 3. API 명세

모든 경로에 `v2/api` prefix가 붙는다.

### 3.1 엔드포인트 목록

| # | Method | Path | Guard | 요약 |
|---|---|---|---|---|
| 1 | GET | `/courses` | Jwt | 내 코스 목록 (status 필터, 페이지네이션) |
| 2 | POST | `/courses` | Jwt | 코스 생성 |
| 3 | GET | `/courses/:courseId` | Jwt | 코스 상세 |
| 4 | PATCH | `/courses/:courseId` | Jwt | 코스 수정 (이름 + stops 배열 통째로 교체) |
| 5 | DELETE | `/courses/:courseId` | Jwt | 코스 삭제 |
| 6 | POST | `/courses/:courseId/stops/:shopId/stamp` | Jwt | 도장 찍기 |
| 7 | DELETE | `/courses/:courseId/stops/:shopId/stamp` | Jwt | 도장 취소 |

### 3.2 API 상세

#### ① GET `/courses` — 내 코스 목록

**Query Parameters**:
```ts
{
  status?: 'in_progress' | 'completed' | 'all'  // 기본: 'all'
  page?: number    // 기본: 1
  limit?: number   // 기본: 20
}
```

**정렬 규칙** (기획 요구사항):
1. 1순위: **진행 중 먼저**, 완료는 나중에
2. 2순위: **`created_at DESC`** (최신순)

```sql
ORDER BY
  (CASE WHEN 완료여부 THEN 1 ELSE 0 END) ASC,
  created_at DESC
```

**Response**:
```ts
{
  status: 200,
  message: "success",
  result: {
    items: [
      {
        id: number,
        name: string,
        createdAt: string,          // ISO
        progress: number,            // 0~100
        status: 'in_progress' | 'completed',
        thumbnails: string[]        // 최대 4개 (소품샵 main_image, 순서대로)
      }
    ],
    total: number,
    page: number,
    limit: number
  }
}
```

> `thumbnails`는 최대 4개 반환. Figma상 4개 초과 시 "..."로 표시하는 건 프론트 책임.

#### ② POST `/courses` — 코스 생성

**Request Body**:
```ts
{
  name: string        // 1~30자, 필수
  shopIds: number[]   // 2~30개, 순서 유지
}
```

**유효성 검증** (class-validator):
- `name`: `@IsString() @Length(1, 30)`
- `shopIds`: `@IsArray() @ArrayMinSize(2) @ArrayMaxSize(30) @IsInt({ each: true })`
- 배열 내 중복 체크 (`@ArrayUnique()`)
- 각 shopId가 실제 존재하는 Shop인지 확인 (Service 레벨)

**트랜잭션 처리 필수** (`course-transactions.repository.ts`):
1. `courses` 레코드 1개 INSERT
2. `course_shops` 레코드 N개 INSERT (`order_index`는 배열 순서대로 1, 2, 3...)
3. 실패 시 롤백

**Response**:
```ts
{
  status: 201,
  message: "코스가 생성되었습니다",
  result: { courseId: number }
}
```

#### ③ GET `/courses/:courseId` — 코스 상세

**권한 체크**: `course.uuid === @GetUUID()` 아니면 `ForbiddenException`

**Response**:
```ts
{
  status: 200,
  message: "success",
  result: {
    id: number,
    name: string,
    createdAt: string,
    updatedAt: string,
    progress: number,
    status: 'in_progress' | 'completed',
    stops: [
      {
        shopId: number,
        orderIndex: number,
        visitedAt: string | null,
        shop: {
          id: number,
          name: string,
          mainImage: string,
          lat: number,
          lng: number,
          isHidden: boolean,    // 숨김 샵은 프론트에서 처리
          instagram: string | null
        }
      }
    ]
  }
}
```

#### ④ PATCH `/courses/:courseId` — 코스 수정

**설계 포인트**: 이름과 stops 배열 전체를 **통째로 교체**하는 방식. 부분 수정 API를 여러 개 만드는 것보다 단순하고, Figma의 "편집 화면에서 한 번에 저장" UX와 일치.

**Request Body**:
```ts
{
  name?: string         // 변경 시에만
  shopIds?: number[]    // 전체 배열 (순서 = 새 order_index), 2~30개
}
```

**트랜잭션 처리 필수** (`course-transactions.repository.ts`): **A안 delta 계산**

- 기존 `(shopId, visited_at, orderIndex)`를 조회
- 새 `shopIds` 배열과 비교해서:
  - **삭제 대상** = 기존에만 있음 → `DELETE`
  - **유지 대상** = 양쪽 모두 → 새 배열에서의 index+1로 `orderIndex`만 UPDATE (`visitedAt` 유지)
  - **신규 대상** = 새 배열에만 있음 → INSERT (`visitedAt` = null)
- `name` 전달됐으면 `Course.name` UPDATE
- 전체를 단일 트랜잭션으로 묶음

**권한 체크**: 본인 코스인지 검증

**Response**:
```ts
{ status: 200, message: "코스가 수정되었습니다", result: null }
```

#### ⑤ DELETE `/courses/:courseId` — 코스 삭제

**권한 체크**: 본인 코스인지 검증

Course 삭제 시 CourseShop은 CASCADE로 자동 삭제됨.

**Response**:
```ts
{ status: 200, message: "코스가 삭제되었습니다", result: null }
```

#### ⑥ POST `/courses/:courseId/stops/:shopId/stamp` — 도장 찍기

**동작**:
1. `course_shops`에서 `(course_id, shop_id)`로 조회
2. 해당 row의 `visited_at`을 현재 시각(`new Date()`)으로 UPDATE
3. 이미 찍힌 상태더라도 에러 아니고 그냥 현재 시각으로 갱신 (idempotent)

**에러 케이스**:
- 코스 소유자 아님 → 403
- 해당 shop이 코스에 없음 → 404
- 코스 자체가 없음 → 404

**Response**:
```ts
{
  status: 200,
  message: "도장이 찍혔습니다",
  result: {
    visitedAt: string,
    progress: number,
    status: 'in_progress' | 'completed'
  }
}
```

#### ⑦ DELETE `/courses/:courseId/stops/:shopId/stamp` — 도장 취소

**동작**: 해당 row의 `visited_at`을 `null`로 UPDATE (idempotent)

**Response**:
```ts
{
  status: 200,
  message: "도장이 취소되었습니다",
  result: {
    progress: number,
    status: 'in_progress' | 'completed'
  }
}
```

---

## 4. 폴더/파일 구조

```
src/api/course/
├── course.module.ts
├── course.controller.ts
├── course.service.ts
├── repositories/
│   ├── course.repository.ts
│   └── course-transactions.repository.ts
├── entities/
│   ├── course.entity.ts
│   └── course-shop.entity.ts
└── dto/
    ├── requests/
    │   ├── create-course.dto.ts
    │   └── update-course.dto.ts
    ├── responses/
    │   ├── get-course-list-response.dto.ts
    │   ├── get-course-detail-response.dto.ts
    │   └── stamp-response.dto.ts
    └── query/
        └── get-course-list-query.dto.ts
```

**Module 등록**: `src/app.module.ts`의 `imports` 배열에 `CourseModule` 추가.

---

## 5. 연관 기존 모듈 확인

### 5.1 User 탈퇴 시 영향
현재 `user-transactions.repository.deleteUser()`는 트랜잭션 안에서 "미승인 제보 삭제 → 프로필 이미지 S3 제거 → User 삭제" 순서로 진행된다.
`Course`는 `User`에 CASCADE로 걸려 있으므로 **User 삭제 시 자동으로 Course 및 CourseShop이 함께 삭제**된다. 추가 수정 불필요.

### 5.2 Shop 숨김 처리(`is_hidden`) 관련
코스 상세 조회 시 `is_hidden = true`인 샵도 그대로 내려준다 (프론트가 표시 처리). 따라서 Shop 조회 쿼리에서 `is_hidden` 필터를 걸면 안 됨에 주의.

### 5.3 기존 `UserFavorite`과의 관계
Figma Step1에서 "찜한 소품샵" 리스트를 기본 노출한다. 이는 **프론트가 `GET /users/me/favorite`으로 찜 목록을 먼저 조회**한 뒤 선택 UI를 그리는 방식이면 충분하다. 백엔드에서 별도 API 신설 불필요.

---

## 6. 테스트 체크리스트 요약

### 정상
- [ ] 생성(2개) → 목록 "진행 중 0%"
- [ ] stamp 1번 → 50%
- [ ] stamp 전부 → 100% / completed
- [ ] unstamp → 다시 진행중
- [ ] 이름만 수정 → stops 유지
- [ ] 순서 바꿔 수정 → order_index 재배치, visited_at 보존
- [ ] 일부 제거 + 신규 추가 → 기존 visited_at 살아남고 신규는 null
- [ ] 삭제 → course_shops CASCADE

### 유효성/권한
- [ ] 1개/31개/중복/31자 → 400
- [ ] 남의 코스 접근 → 403
- [ ] 없는 코스 → 404
- [ ] 코스에 없는 shop stamp → 404
- [ ] 미인증 → 401

### 엣지
- [ ] stamp 2회 연속 → idempotent
- [ ] unstamp 2회 연속 → idempotent
- [ ] 100% 후 unstamp → in_progress 복귀
- [ ] is_hidden 샵 포함 → 정상 반환

---

## 7. 추후 확장 (이번 범위 아님)

- 코스 공유(내부): `is_public`, `shared_from_course_id` 등
- 코스 커버 이미지 업로드
- 방문 메모/사진 (`course_shops`에 컬럼 추가)
- 추천 코스
- 배지/업적
