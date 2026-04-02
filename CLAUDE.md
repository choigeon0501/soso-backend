# 소소한 소품샵 (soso) Server

## 서비스 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 소소한 소품샵 (soso) |
| **목적** | 위치 기반 소품샵 탐색·리뷰·제보(소품샵/영업정보/상품) 및 관리자 승인 워크플로를 제공하는 백엔드 API 서버 |
| **기술 스택** | NestJS 10, TypeORM, MySQL, JWT, OAuth 2.0(Google·Apple), S3, Winston |
| **패키지 매니저** | pnpm |
| **Node** | 20.x |
| **API Prefix** | `v2/api` |
| **Swagger** | `/v2/api/api-docs` |

## 도메인 및 모듈

| 도메인 | 설명 | 주요 엔티티 |
|--------|------|-------------|
| Auth | 소셜 로그인(Google·Apple)·JWT 발급·갱신 | `AuthIdentity` |
| User | 회원 프로필·닉네임·프로필 이미지·탈퇴·즐겨찾기·최근검색·내 리뷰/제보 조회 | `User`, `UserFavorite`, `UserWithdrawal` |
| Shop | 소품샵 CRUD·위치 기반 검색(1 km)·키워드 검색·제보(신규/영업정보/상품)·신고 | `Shop`, `ShopProduct`, `ShopProductMapping`, `ShopOperatingHour`, `ShopSubmitRecord`, `ShopReport`, `RecentSearch` |
| Review | 리뷰 작성·수정·삭제·이미지·신고·밴 | `Review`, `ReviewImage`, `ReviewBan`, `ReviewReport` |
| Region | 지역 마스터 데이터 | `Region` |
| Notice | 공지사항 관리 | `Notice` |
| Feedback | 사용자 피드백 수집 | `Feedback` |
| Admin | 관리자 로그인·사용자/제보/신고/피드백 관리·콘텐츠 숨김 처리 | `AdminUser` |
| Common | AWS S3 업로드·Winston 로거·JWT 모듈·가드·필터·파이프·데코레이터 | (엔티티 없음) |

### 미완성 모듈 (스텁)

| 모듈 | 상태 |
|------|------|
| Wishlist | 컨트롤러만 존재 — 실제 기능은 User 모듈의 `UserFavorite`로 구현 |
| RecentSearch | 서비스 파일 비어 있음 — 실제 기능은 Shop 모듈의 `RecentSearch`로 구현 |

## 프로젝트 구조 규칙

### 도메인 단위 모듈 구조 (현재 실제 구조)

```
src/
├── api/
│   └── <domain>/
│       ├── <domain>.module.ts
│       ├── <domain>.controller.ts
│       ├── <domain>.service.ts          # 또는 services/ 하위 분리
│       ├── repositories/
│       ├── entities/
│       └── dto/
│           ├── request/
│           ├── response/
│           └── query/
├── common/
│   ├── aws/          # S3 업로드·Presigned URL
│   ├── jwt/          # JWT 전략·가드 (JwtAuthGuard, OptionalAuthGuard)
│   ├── admin-jwt/    # 관리자 전용 JWT
│   ├── logger/       # Winston 로거
│   ├── filter/       # ExceptionFilter, SuccessResponseFilter
│   ├── pipe/         # CustomValidationPipe, SanitizePipe
│   ├── enum/         # AuthProvider, Role, SubmitType/Status, ReportType 등
│   ├── deco/         # @GetUUID() 커스텀 데코레이터
│   └── function/     # normalizePhoneNumber, getInstaId 등 유틸
├── swagger/
├── app.module.ts
└── main.ts
```

### 레이어드 아키텍처 (Controller → Service → Repository)

- **Controller**: HTTP 요청/응답 처리 + Swagger 데코레이터. 비즈니스 로직 금지, Service 호출만.
- **Service**: 도메인 비즈니스 로직의 중심. Repository 주입, 다른 Service와 협력.
- **Repository**: 순수 데이터 접근. `@InjectRepository`로 TypeORM Repository 주입. 비즈니스 규칙 포함 금지.

### 네이밍 규칙

- **엔티티**: 단수형 (`User`, `Shop`, `Review`). 복수형 금지. `*Model` 접미사 없음.
- **Request DTO**: 동사 + 대상 + Dto (`CreateUserDto`, `UpdateUserDto`)
- **Response DTO**: {Target}{Detail}ResponseDto (`GetUserProfileResponseDto`)

### 의존성

- 순환 참조 필요 시 `forwardRef()` 사용
- Repository는 다른 도메인 Repository/Service에 직접 의존 금지. 도메인 간 협력은 Service에서.

## 인증

- JWT Access Token / Refresh Token (PassportJS)
- 소셜 로그인: Google OAuth (Code → Access Token → UserInfo), Apple Sign-In (ID Token 검증)
- Guards: `JwtAuthGuard` (필수 인증), `OptionalAuthGuard` (선택적 인증), `AdminJwtAuthGuard` (관리자 전용)
  - 위치: `src/common/jwt/`, `src/common/admin-jwt/`
- 인증 필요 API: `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`
- 사용자 식별: `@GetUUID()` 커스텀 데코레이터로 JWT에서 UUID 추출

## 이미지 업로드

- S3 직접 업로드 (multer memoryStorage). 서버 로컬 저장 없음.
- 프로필 이미지: `PATCH /users/me` (multipart, 최대 5MB)
- 리뷰 이미지: `POST /shops/:shopId/reviews` (multipart, 최대 10장, 각 5MB)
- Presigned URL로 이미지 조회

## 응답·검증·DB

- SuccessResponseFilter: `{ status, message, result }` 래핑
- 전역 CustomValidationPipe: `class-validator` + `class-transformer` + SanitizePipe
- Rate Limiting: 10 req / 10s, 60s 차단 (Throttler)
- DB: MySQL, TypeORM auto-sync
- 환경: `NODE_ENV` 기준 (`dev` / `prd`)

## Swagger 규칙

- 모든 public API에 Swagger 데코레이터 필수
- Controller: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation({ summary })`, `@ApiResponse({ status, description, type })`
- 400/에러 응답은 별도 정의하지 않음
- DTO 필드: `@ApiProperty` / `@ApiPropertyOptional`으로 타입/예제 명시

## 코드 스타일 (빈 줄 규칙)

### Service 메서드 내부

논리 블록 단위로 빈 줄을 넣는다. 같은 단계는 붙여 쓰고, 단계가 바뀔 때만 빈 줄 1개.

| 단계 | 내용 |
|------|------|
| 입력 검증 | 파라미터 유효성 검사 후 throw |
| 조회 | Repository/Service 조회 |
| 존재/유효성 검사 | 조회 결과 null 체크 후 throw |
| 추가 비즈니스 검증 | 중복/권한 검사 등 |
| 실제 수행 | create/update/delete 등 |

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

### 조건문과 비동기

if/else 안에 `await`를 직접 넣지 않는다. 변수로 먼저 할당 후 조건문에서 사용.

```ts
// ✅
const isBlocked = await this.usersService.isBlockedBy(receiverId, senderId);
if (!isBlocked) {
  this.chatsGateway.notifyNewMessage(receiverId, result);
}
```

### 기타

- 메서드 간 빈 줄 1개. 2줄 이상 금지.
- Controller: 데코레이터 블록 내부는 붙여 쓰기. 엔드포인트 간 빈 줄 1개.

## 커밋 컨벤션

Conventional Commits 스타일, 요약은 한국어.

```
<type>(<scope>): <요약 (한국어, 72자 이내, 마침표 생략)>

- 선택: 상세 내용 불릿
```

| type | 용도 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| refactor | 리팩터링 (동작 변경 없음) |
| chore | 빌드, 설정, 기타 |
| docs | 문서만 변경 |
| style | 코드 스타일/포맷 (로직 변경 없음) |

scope: 변경 도메인/모듈 (예: `users`, `auth`, `chats`)

## 금지사항

- JWT 시크릿·AWS 키·DB 비밀번호 등을 코드·문서·커밋에 포함 금지
- 엔티티 복수형 네이밍 금지
- Repository에 비즈니스 로직 포함 금지
