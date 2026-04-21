# 소소한 소품샵 (soso-backend) — 프로젝트 개요

> 새로운 기능을 추가할 때 참고할 수 있도록 현재 백엔드의 구조와 기능, 데이터 모델, 인증·업로드·공통 인프라를 모두 정리한 문서입니다.
> 기준일: 2026-04-20 / 현재 브랜치: `main`

---

## 1. 서비스 한눈에 보기

| 항목 | 내용 |
|---|---|
| 서비스명 | 소소한 소품샵 (soso) |
| 목적 | 위치 기반 소품샵 탐색·리뷰·제보(소품샵/영업정보/상품) 및 관리자 승인 워크플로를 제공하는 백엔드 API |
| 기술 스택 | NestJS 10, TypeORM 0.3, MySQL, Passport(JWT/Google), Apple Sign-In, AWS S3, Winston, Helmet, Throttler |
| 언어/런타임 | TypeScript 5.9 / Node 20.x |
| 패키지 매니저 | pnpm (lockfile은 `package-lock.json`도 존재) |
| API Prefix | `v2/api` (`app.setGlobalPrefix('v2/api')`) |
| Swagger | `/v2/api/api-docs` |
| Rate Limit | 10 req / 10s, 차단 시 60s (`@nestjs/throttler`, 글로벌 `ThrottlerGuard`) |
| 운영 도메인 | `api.sosohan.shop` (운영 시 443 + Let's Encrypt 인증서 직접 로드) |
| 개발 모드 | `NODE_ENV=dev`, port 80 / TypeORM `synchronize: true` |
| 프로덕션 모드 | `NODE_ENV=prd`, port 443, HTTPS, `synchronize: false` |

`src/main.ts`에서 Helmet 적용(`frameguard deny`, CSP off, CORS 전면 허용), 글로벌 `CustomValidationPipe`, Swagger 설정.
`src/app.module.ts`에서 TypeORM 엔티티 자동 스캔(`**/entities/*.entity{.ts,.js}`), 글로벌 필터/가드/인터셉터 등록:

- `APP_GUARD`: `ThrottlerGuard`
- `APP_FILTER`: `ExceptionFilter` (`src/common/filter/http-exception.filter.ts`)
- `APP_INTERCEPTOR`: `SuccessResponseFilter` — 모든 응답을 `{ status, message, result }`로 래핑

---

## 2. 디렉토리 구조

```
src/
├── api/                           # 도메인 모듈 (레이어드 아키텍처)
│   ├── admin/                     # 관리자 로그인·승인·조회
│   ├── auth/                      # 소셜 로그인·JWT
│   ├── feedback/                  # 사용자 피드백 수집
│   ├── notice/                    # 공지사항
│   ├── recent-search/             # (스텁, 실기능은 shop 모듈)
│   ├── region/                    # 지역 마스터
│   ├── review/                    # 리뷰/이미지/밴/신고
│   ├── shop/                      # 소품샵·운영정보·상품·제보·신고·최근검색
│   ├── user/                      # 프로필·찜·탈퇴
│   └── wishlist/                  # (스텁, 실기능은 user 모듈)
├── common/
│   ├── admin-jwt/                 # AdminJwtModule, AdminJwtAuthGuard, admin-jwt.strategy
│   ├── aws/                       # AwsService (S3 업로드/삭제)
│   ├── deco/                      # @GetUUID() 커스텀 데코레이터
│   ├── enum/                      # Auth / Role / Submit / Report / Sort / Image 등
│   ├── filter/                    # ExceptionFilter, SuccessResponseFilter
│   ├── function/                  # getInstaId, normalizePhoneNumber, timeToAmPm 등 유틸
│   ├── gurad/                     # admin.guard, optional-auth-guard  (※ 오타: gurad)
│   ├── jwt/                       # JwtModule, JwtAuthGuard, jwt.strategy
│   ├── logger/                    # Winston 일일 롤링 로거
│   ├── pipe/                      # CustomValidationPipe, SanitizePipe
│   └── response/                  # 공통 ResponseDto
├── swagger/                       # setupSwagger
├── app.controller.ts              # 헬스체크용
├── app.module.ts
└── main.ts
```

### 레이어드 아키텍처

각 도메인 모듈은 **Controller → Service → Repository** 3층 구조로 엄격하게 분리되어 있습니다.

- **Controller**: HTTP/Swagger 처리 전용, 비즈니스 로직 금지
- **Service**: 비즈니스 로직 중심, 여러 Repository와 다른 Service를 조합
- **Repository**: 순수 데이터 접근, 트랜잭션이 필요한 경우 별도의 `*-transactions.repository.ts` 파일로 분리

### 엔티티/DTO 네이밍

- 엔티티: 단수형 (`User`, `Shop`, `Review`), `*Model` 금지
- Request DTO: `CreateUserDto`, `UpdateUserDto`, `PostReviewDto`
- Response DTO: `GetUserProfileResponseDto` 형태

---

## 3. 인증 (Auth)

### 지원 방식

| Provider | 방식 |
|---|---|
| Google | OAuth 2.0 code → access_token → userinfo (passport-google-oauth20 X, 직접 axios) |
| Apple | ID Token 검증 (`apple-signin-auth`, `jose`) |

### JWT 구조

- 액세스/리프레시 토큰 발급 — `AuthTokenService.issueTokens(uuid, role)`
- 관리자 토큰은 별도로 `issueAdminToken(email)` 발급
- 페이로드: `{ sub: uuid, role }` (일반 사용자) 또는 이메일 기반(관리자)

### Guard 3종

| Guard | 위치 | 용도 |
|---|---|---|
| `JwtAuthGuard` | `src/common/jwt/jwt-auth.guard.ts` | 일반 사용자 인증 필수 |
| `OptionalAuthGuard` | `src/common/gurad/optional-auth-guard.guard.ts` | 인증 선택적 (비로그인도 허용) |
| `AdminJwtAuthGuard` | `src/common/admin-jwt/admin-jwt-auth.guard.ts` | 관리자 전용 |

### 사용자 식별

Controller 메서드 파라미터에서 `@GetUUID() uuid: string`로 JWT에서 UUID를 추출.

### 관련 엔티티

- `AuthIdentity` — `(provider, provider_uid)` UNIQUE, `users.uuid` FK (CASCADE)

---

## 4. 데이터 모델 (엔티티)

> MySQL, TypeORM `synchronize: true` (dev). 엔티티 자동 스캔 경로: `src/**/entities/*.entity.ts`.

### 4.1 User 도메인

| 엔티티 | 테이블 | 핵심 컬럼 | 관계 |
|---|---|---|---|
| `User` | `users` | uuid(PK, char36), email(UNIQUE), profile_img, nickname(UNIQUE), last_activity_at, created_at, updated_at | 1:N `AuthIdentity`, 1:N `ReviewBan` |
| `UserFavorite` | `user_favorites` | id, uuid(FK), shop_id(FK), created_at | User, Shop ManyToOne (CASCADE) |
| `UserWithdrawal` | `user_withdrawals` | id, uuid, nickname, reason_code, created_at (아카이빙 전용 — FK 없음) | — |

### 4.2 Auth 도메인

| 엔티티 | 테이블 | 핵심 컬럼 |
|---|---|---|
| `AuthIdentity` | `auth_identities` | id, uuid(FK), provider, provider_uid, UNIQUE(provider, provider_uid) |

### 4.3 Shop 도메인 (가장 복잡)

| 엔티티 | 테이블 | 핵심 컬럼 | 특이사항 |
|---|---|---|---|
| `Shop` | `shops` | id, name, main_image, is_verified, instagram, **lat/lng(decimal 10,7)**, location, is_hidden, region_id, created_at, updated_at | Region N:1 (RESTRICT) |
| `ShopOperatingHour` | `shop_operating_hours` | id, is_verified, phone_number, days_of_week(SET enum), start_time, end_time, shop_id | Shop N:1 (CASCADE) |
| `ShopProduct` | `shop_products` | id, name | 상품 마스터 |
| `ShopProductMapping` | `shop_product_mappings` | id, is_verified, product_id, shop_id, submit_record_id | Shop ↔ Product 매핑 + 제보 연결 |
| `ShopSubmitRecord` | `shop_submit_records` | id, type(enum: new_shop/new_operating/new_product), status(pending/approved/rejected), reject_message, uuid, shop_operating_id, shop_id | 제보 워크플로의 중심 |
| `ShopReport` | `shop_reports` | id, uuid(FK), shop_id(FK), report_type, report_message, created_at | — |
| `RecentSearch` | `recent_searches` | id, uuid(FK), shop_id(FK), created_at | — |

### 4.4 Review 도메인

| 엔티티 | 테이블 | 핵심 컬럼 | 관계 |
|---|---|---|---|
| `Review` | `reviews` | id, content, is_hidden, uuid(NULLable, SET NULL), shop_id | User N:1 (SET NULL), Shop N:1 (CASCADE), ReviewImage M:N via `review_image_mappings` |
| `ReviewImage` | `review_images` | id, file_key | Review M:N |
| `ReviewBan` | `review_bans` | id, uuid, review_content, ban_reason, ban_start_at, ban_end_at | User N:1 (CASCADE) |
| `ReviewReport` | `review_reports` | id, uuid, review_id, report_type, report_message, created_at | User, Review N:1 (CASCADE) |

### 4.5 그 외

| 엔티티 | 테이블 | 핵심 컬럼 |
|---|---|---|
| `AdminUser` | `admin_user` | id, email(UNIQUE), password(bcrypt), lastLoginAt |
| `Feedback` | `feedbacks` | id, uuid(FK), content, created_at |
| `Notice` | `notices` | id, title, content, created_at, updated_at |
| `Region` | `region` | id, name (`OneToMany` Shop) |

### 4.6 데이터 패턴

- **Soft delete**: `Shop.is_hidden`, `Review.is_hidden` (관리자가 숨김 토글)
- **SET NULL**: `Review.uuid`는 유저 탈퇴 후에도 리뷰는 남기되 작성자만 제거
- **승인 워크플로**: `Shop`, `ShopOperatingHour`, `ShopProductMapping`의 `is_verified`가 최종 상태를 의미하고, `ShopSubmitRecord.status`가 승인 과정(pending/approved/rejected)을 추적

---

## 5. API 전체 맵

> 모든 경로는 `v2/api` prefix가 앞에 붙습니다. 총 엔드포인트 약 50개.

### 5.1 Auth `/auth`

| Method | Path | Guard | 요약 |
|---|---|---|---|
| POST | `/auth/google` | — | 구글 소셜 로그인 |
| POST | `/auth/apple` | — | 애플 소셜 로그인 |
| POST | `/auth/refresh` | — | 리프레시 토큰으로 재발급 |

### 5.2 User `/users`

| Method | Path | Guard | 요약 |
|---|---|---|---|
| GET | `/users/me` | Jwt | 내 프로필 |
| PATCH | `/users/me` | Jwt | 프로필 수정 (이미지 multipart) |
| DELETE | `/users/me` | Jwt | 회원 탈퇴 (트랜잭션: 미승인 제보 제거 + 탈퇴 기록) |
| GET | `/users/duplicate-check` | — | 닉네임 중복 체크 |
| GET | `/users/me/shop-submissions` | Jwt | 내 제보 목록 (페이지네이션) |
| DELETE | `/users/me/shop-submissions/:submitId` | Jwt | 내 제보 삭제 |
| GET | `/users/me/reviews` | Jwt | 내 리뷰 목록 (페이지네이션) |
| GET | `/users/me/favorite` | Jwt | 찜 목록 (지역 필터 + 페이지네이션) |
| POST | `/users/me/favorite` | Jwt | 찜 토글(추가/제거) |
| GET | `/users/me/recent-searches` | Optional | 최근 검색 |
| DELETE | `/users/me/recent-searches` | Jwt | 최근 검색 전체 삭제 |
| DELETE | `/users/me/recent-searches/:recentSearchId` | Jwt | 최근 검색 단일 삭제 |

### 5.3 Shop `/shops`

| Method | Path | Guard | 요약 |
|---|---|---|---|
| GET | `/shops` | Optional | 1km 반경 내 소품샵 (Haversine 거리 계산) |
| POST | `/shops` | Jwt | 신규 소품샵 제보 |
| GET | `/shops/search` | — | 키워드 검색 (페이지네이션) |
| GET | `/shops/:shopId` | Optional | 상세 (userReviews/otherReviews/wishlist/imageList 병렬 수집) |
| POST | `/shops/:shopId/operating` | Jwt | 운영정보 제보 |
| POST | `/shops/:shopId/products` | Jwt | 판매 상품 제보 |
| POST | `/shops/:shopId/reviews` | Jwt | 리뷰 작성 (이미지 최대 10장, 각 5MB) |
| PATCH | `/shops/:shopId/reviews/:reviewId` | Jwt | 리뷰 수정 |
| DELETE | `/shops/:shopId/reviews/:reviewId` | Jwt | 리뷰 삭제 (S3 이미지 + DB 트랜잭션) |
| POST | `/shops/:shopId/shop/report` | Jwt | 소품샵 신고 |
| POST | `/shops/:shopId/reviews/:reviewId/report` | Jwt | 리뷰 신고 |

> **주의**: 리뷰 관련 엔드포인트는 독립된 `review` 컨트롤러가 없고 모두 `shop.controller.ts`에 통합되어 있습니다. `wishlist`, `recent-search` 컨트롤러도 실제로는 비어 있으며 실기능은 user/shop 쪽에 있습니다.

### 5.4 Admin `/admin`

| Method | Path | Guard | 요약 |
|---|---|---|---|
| POST | `/admin/login` | — | 관리자 로그인 |
| GET | `/admin/users` | AdminJwt | 활성/탈퇴 사용자 조회 (쿼리 파라미터로 구분) |
| GET | `/admin/shop-reports` | AdminJwt | 소품샵 신고 목록 |
| GET | `/admin/review-reports` | AdminJwt | 리뷰 신고 목록 (`reviewId`, `isHidden` 포함 — 최근 커밋 `eced0f4`) |
| GET | `/admin/submission` | AdminJwt | 제보 목록 (type/status/sort 쿼리) |
| GET | `/admin/feedback` | AdminJwt | 피드백 목록 |
| PATCH | `/admin/submission/:id/product/accept` | AdminJwt | 상품 제보 승인 |
| PATCH | `/admin/submission/:id/product/reject` | AdminJwt | 상품 제보 반려 |
| PATCH | `/admin/submission/:id/operating-info/accept` | AdminJwt | 운영정보 제보 승인 |
| PATCH | `/admin/submission/:id/operating-info/reject` | AdminJwt | 운영정보 제보 반려 |
| PATCH | `/admin/submission/:id/new-shop/accept` | AdminJwt | 신규 샵 제보 승인 |
| PATCH | `/admin/submission/:id/new-shop/reject` | AdminJwt | 신규 샵 제보 반려 |
| PATCH | `/admin/shops/:shopId/hidden` | AdminJwt | 소품샵 숨김/해제 |
| PATCH | `/admin/reviews/:reviewId/hidden` | AdminJwt | 리뷰 숨김/해제 |

### 5.5 Feedback / Notice / Region

| Method | Path | Guard | 요약 |
|---|---|---|---|
| POST | `/feedback` | Jwt | 피드백 등록 |
| GET | `/notices` | — | 공지사항 전체 |
| GET | `/regions` | — | 지역 전체 |

---

## 6. 도메인별 핵심 로직

### 6.1 제보 승인 워크플로 (Shop)

`ShopSubmitRecord`가 중심. `type`은 `new_shop`/`new_operating`/`new_product` 중 하나, `status`는 `pending → approved | rejected`.

- `shop.service.createNewShop()` → 새 `Shop`을 `is_verified: false`로 생성하고 `ShopSubmitRecord(type=new_shop, status=pending)` 저장
- 운영정보/상품은 기존 샵에 **추가 row**로 저장되고 `is_verified: false`로 대기. 승인 시 기존 verified 데이터를 삭제하고 새 데이터를 verified로 올림
- 관리자 승인/거절은 `shop-submit-transactions.repository.ts`의 트랜잭션 메서드가 담당

### 6.2 1km 반경 검색

`ShopRepository.findShopsWithin1Km()` — Haversine 공식을 SQL expression으로 직접 계산. lat/lng는 `decimal(10,7)`.

### 6.3 찜 토글

`POST /users/me/favorite`는 생성이 아니라 **토글**. `user-favorite.repository.findUserFavoriteByShopIdAndUUID()`로 존재 확인 후 있으면 삭제, 없으면 생성.

### 6.4 리뷰 이미지 관리

- `Review ↔ ReviewImage`가 **ManyToMany** (조인 테이블 `review_image_mappings`)
- 생성/수정/삭제 모두 `review-transactions.repository.ts`에서 S3 업로드·삭제와 DB 변경을 트랜잭션으로 묶음
- 최대 10장, 각 5MB

### 6.5 사용자 탈퇴

`user-transactions.repository.deleteUser()`가 트랜잭션 안에서:
1. 미승인(pending) 제보 삭제
2. 프로필 이미지 S3에서 제거
3. `User` 삭제 (AuthIdentity는 CASCADE로 함께 삭제됨)
4. `UserWithdrawal` 아카이빙 row 생성

### 6.6 리뷰 밴 시스템

`ReviewBan`은 `ban_start_at ~ ban_end_at` 기간 동안 유효. 리뷰 작성/수정 전 `findUserReviewBanByUuid()`로 활성 밴을 확인.

---

## 7. 공통 인프라 (`src/common/`)

### 7.1 응답 래핑 — `SuccessResponseFilter`

모든 성공 응답은 `{ status: number, message: string, result: any }` 형태로 감싸집니다. Controller 반환값이 `result`에 그대로 들어가므로 컨트롤러에서 포맷을 직접 만들 필요 없음.

### 7.2 예외 필터 — `ExceptionFilter`

NestJS `HttpException` + 기타 에러 포착, Winston 로거로 기록.

### 7.3 파이프

- `CustomValidationPipe` — `class-validator` + `class-transformer`, whitelist/forbidNonWhitelisted 등
- `SanitizePipe` — XSS 등 방어용 정제

### 7.4 S3 업로드 — `AwsService`

- `uploadImagesToS3(files, imageType)` — 여러 파일을 동시에 업로드 (Promise.all). 키 포맷: `{imageType}/{timestamp}-{originalname}`
- `deleteImageFromS3(imageUrl)` — 저장된 URL에서 key를 역추출하여 삭제
- 업로드 타입: `UploadType.User | Shop | Review` (src/common/enum/image.enum.ts)
- **로컬 저장 없음** — multer `memoryStorage` 사용, 5MB 제한

### 7.5 로거 — Winston

일일 롤링 파일(`logs/`). `LoggerService.logError(context, err)` 등 메서드 제공.

### 7.6 커스텀 데코레이터

- `@GetUUID()` — JWT 페이로드에서 uuid 추출

### 7.7 주요 Enum

| Enum | 값 | 위치 |
|---|---|---|
| `AuthProvider` | GOOGLE, APPLE | `auth.enum.ts` |
| `Role` | Admin, User | `role.enum.ts` |
| `SubmitType` | NewShop, NewOperating, NewProduct | `role.enum.ts` |
| `SubmitStatus` | Pending, Approved, Rejected | `role.enum.ts` |
| `ShopReportType` | CLOSED, WRONG_LOCATION | `report.enum.ts` |
| `ReviewReportType` | IRRELEVANT, ABUSIVE, PERSONAL_INFO, ADVERTISEMENT, DUPLICATE, OTHER | `report.enum.ts` |
| `UploadType` | User, Shop, Review | `image.enum.ts` |
| `SortOrder` | ASC, DESC | `sorting.enum.ts` |
| `BanReason` | (비어 있음) | `review-ban.enum.ts` |

### 7.8 유틸 함수

- `normalizePhoneNumber()` — 전화번호 정규화
- `getInstaId()` — 인스타그램 URL → ID 추출
- `timeToAmPm()` — 시간 변환
- `getSubmitStatusEnum()` — 문자열 → `SubmitStatus` 매핑

---

## 8. 코드 스타일 규칙

`CLAUDE.md`에 명시된 팀 컨벤션을 그대로 따릅니다 (요약).

### 빈 줄 규칙 (Service)

논리 블록 단위로 1줄 빈 줄. 같은 단계는 붙여 쓴다.

```ts
async deleteBookmark(userId: number, venueId: number): Promise<void> {
  const bookmark =
    await this.venueBookmarkRepository.findByUserIdAndVenueId(userId, venueId);
  if (!bookmark) {
    throw new NotFoundException('북마크를 찾을 수 없습니다.');
  }

  await this.venueBookmarkRepository.remove(bookmark);
}
```

### if/await

```ts
// ❌  if (!(await this.isBlocked(...))) { ... }
// ✅
const isBlocked = await this.usersService.isBlockedBy(receiverId, senderId);
if (!isBlocked) {
  this.chatsGateway.notifyNewMessage(receiverId, result);
}
```

### 기타

- 메서드 간 빈 줄 1개. 2줄 이상 금지
- Controller 데코레이터 블록 내부는 붙여 쓰고, 엔드포인트 간 빈 줄 1개
- Swagger: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation({ summary })`, `@ApiResponse({ status, description, type })` 필수
- Request DTO는 `@ApiProperty` / `@ApiPropertyOptional`로 예제/타입 명시

### 커밋 컨벤션

Conventional Commits (한국어 요약):

```
<type>(<scope>): <요약 72자 이내>
```

type: `feat | fix | refactor | chore | docs | style`

---

## 9. 새 기능을 추가할 때 체크리스트

1. **도메인 선택**: 기존 도메인에 속하는지 vs 새 도메인인지 판단. 새 도메인이면 `src/api/<domain>/` 밑에 module, controller, service, repository, entities, dto 하위폴더 전부 생성
2. **엔티티 추가**: `src/api/<domain>/entities/<name>.entity.ts` — 단수형 이름, `@Entity('<table_name>')`, 관계 명시, CASCADE/SET NULL 결정
3. **Repository**: 트랜잭션이 필요하면 `<name>-transactions.repository.ts`로 분리
4. **Service**: 비즈니스 로직 여기서만. 빈 줄 규칙과 `if(!await)` 금지 규칙 준수
5. **Controller**: `@ApiOperation({ summary })`와 응답 `@ApiResponse` 필수. 인증 필요하면 `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`. uuid는 `@GetUUID()`로
6. **DTO**: `request/`, `response/`, `query/` 폴더 구분. `@ApiProperty`/`@ApiPropertyOptional` 꼭 달기
7. **Module 등록**: `app.module.ts`에 import. TypeORM 엔티티는 자동 스캔이라 별도 등록 불필요
8. **Swagger 확인**: `/v2/api/api-docs`에서 잘 뜨는지 검증
9. **이미지 업로드가 필요하면**: `FilesInterceptor` + `AwsService.uploadImagesToS3()`. `UploadType` enum 확장도 고려
10. **권한 확인**: 일반 사용자용인지, 관리자용인지, 선택적 인증인지에 따라 Guard 선택

---

## 10. 현재 알려진 정리 대상 / 유의점

- `src/api/wishlist/`, `src/api/recent-search/` — **컨트롤러 비어 있음**. 실기능은 각각 `user`, `shop` 모듈에 있음
- `src/api/review/`에도 **컨트롤러가 없음**. 리뷰 엔드포인트 전부 `shop.controller.ts`에 있음 → 새 리뷰 관련 기능은 여기에 추가하거나 이번에 분리 고려
- `src/common/gurad/` — 디렉토리명 오타 (`gurad` → `guard`). 신규 파일 추가 시 기존 경로 유지
- `BanReason` enum이 비어 있음. 필요하면 값 채우기
- CORS가 전면 허용(`origin → callback(null, true)`) 상태 — 프로덕션 보안 리뷰 필요 여지
- TypeORM `synchronize: true`가 dev에서 켜져 있어 엔티티 수정이 DB에 즉시 반영됨. 운영(`prd`)은 꺼져 있음 → 마이그레이션 전략이 아직 없음
- 최근 리팩토링 이슈는 `REFACTORING.md` 참고

---

## 11. 참고 파일

| 파일 | 내용 |
|---|---|
| `CLAUDE.md` | 팀 컨벤션 / 코드 스타일 / 커밋 규칙 원본 |
| `REFACTORING.md` | 리팩토링 플랜 / TODO |
| `README.md` | 초기 README |
| `.env` | DB, AWS, JWT 비밀 (커밋 금지) |
| `src/swagger/swagger.ts` | Swagger 설정 |
| `src/app.module.ts` | 루트 모듈, 전역 가드/필터/인터셉터 등록 |
| `src/main.ts` | bootstrap, HTTPS, Helmet, CORS, prefix |
