# 리팩토링 계획서

> 프로젝트 전체 분석 후 도출된 리팩토링 항목을 **우선순위별**로 정리한 문서입니다.

---

## 🔴 P0 — 즉시 수정 (보안·데이터 안전)

### 1. ~~CORS 설정이 사실상 전체 허용~~ (미완료 — 수정 대기)

- **파일**: `src/main.ts:42`
- **현상**: `if (!origin || true)` — `|| true` 때문에 모든 origin이 허용됨
- **영향**: 어떤 도메인에서든 API 호출 가능, CSRF 공격에 취약
- **수정 방향**: 허용 origin 목록을 환경변수로 관리

### ~~2. TypeORM `synchronize: true`가 프로덕션에서도 동작~~ ✅

- **파일**: `src/app.module.ts:38`
- **수정 완료**: `synchronize: configService.get<string>('NODE_ENV') !== 'prd'`

### 3. ~~에러 로그에 민감 데이터(request.body) 전체 기록~~ (미완료 — 수정 대기)

- **파일**: `src/common/filter/http-exception.filter.ts:43, 60`
- **현상**: 에러 발생 시 `request.body` 전체를 Winston 로그에 기록
- **영향**: 비밀번호·토큰 등이 로그 파일에 남음
- **수정 방향**: 민감 필드(password, token 등) 마스킹 후 로그

### ~~4. S3 클라이언트 초기화 실패 시 에러 무시~~ ✅

- **파일**: `src/common/aws/aws.service.ts:16-29`
- **수정 완료**: catch에서 에러를 다시 throw하여 앱 시작 자체를 실패시킴

### ~~5. 인증 테스트 엔드포인트가 프로덕션에 노출~~ ✅

- **파일**: `src/api/auth/auth.controller.ts`, `src/api/auth/services/auth.service.ts`
- **수정 완료**: `GET /auth/test` 엔드포인트 및 `test()` 메서드 완전 삭제

---

## 🟠 P1 — 높은 우선순위 (아키텍처·버그)

### 6. ShopService God Object (488줄, 의존성 15+개)

- **파일**: `src/api/shop/shop.service.ts`
- **현상**: 소품샵 조회, 제보, 리뷰 CRUD, 신고, 관리자 승인까지 단일 서비스에 집중
- **영향**: 테스트·유지보수 어려움, 순환 참조 유발
- **수정 방향**: 아래와 같이 분리
  - `ShopQueryService` — 검색·상세 조회
  - `ShopSubmissionService` — 제보 생성·승인·반려
  - `ShopAdminService` — 관리자 전용 (신고 조회, 숨김 토글)
  - 리뷰 관련 → `ReviewService`로 위임

### 7. Repository에 비즈니스 로직 혼재

- **파일**:
  - `src/api/user/repositories/user-transactions.repository.ts:56-121` — 탈퇴 시 제보 정리·S3 삭제·하드 삭제 오케스트레이션
  - `src/api/review/repositories/review-transactions.repository.ts:14-162` — 트랜잭션 관리·S3 이미지 삭제
  - `src/api/shop/repositories/shop-submit-transactions.repository.ts` — 제보 승인/반려 비즈니스 로직
- **영향**: CLAUDE.md 규칙("Repository에 비즈니스 로직 포함 금지") 위반
- **수정 방향**: 트랜잭션 오케스트레이션을 Service 레이어로 이동, Repository는 순수 CRUD만

### 8. JWT 만료 처리 불일치

- **파일**:
  - User JWT: `src/common/jwt/jwt.strategy.ts:18` — `ignoreExpiration: true` + 수동 만료 체크
  - Admin JWT: `src/common/admin-jwt/admin-jwt.strategy.ts:22` — `ignoreExpiration: false` (Passport 자동)
- **영향**: 보안 정책 불일치, 수동 체크는 오류 가능성 높음
- **수정 방향**: 모두 `ignoreExpiration: false`로 통일, Passport에 위임

### 9. `convertTimeToAmPm()` 12시간 변환 버그

- **파일**: `src/common/function/time-to-am-pm.function.ts`
- **현상**: `"14:30"` → `"오후 14:30"` (24시간 그대로 출력)
- **기대**: `"14:30"` → `"오후 02:30"`
- **수정 방향**: `hour > 12` 일 때 `hour - 12` 처리 추가

### 10. 동일 조건에 대해 다른 예외 타입 사용

- **파일**: `src/api/shop/shop.service.ts`
- **현상**: "소품샵을 찾을 수 없음"에 `NotFoundException` (line 134, 222, 244, 282) **과** `ConflictException` (line 200, 259, 269) 혼용
- **수정 방향**: 존재하지 않는 리소스 → `NotFoundException`으로 통일

### 11. `UserTransactionsRepository`에서 `commitTransaction()` 2회 호출

- **파일**: `src/api/user/repositories/user-transactions.repository.ts:39-41`
- **현상**: 복사-붙여넣기로 `commitTransaction()`이 연속 2번 호출됨
- **수정 방향**: 중복 호출 제거

### 12. `AuthTransactionService`에서 User 엔티티에 없는 `provider` 필드 저장 시도

- **파일**: `src/api/auth/services/auth-transcation.service.ts:20-25`
- **현상**: `User` 엔티티에 `provider` 컬럼이 없는데 save 객체에 포함
- **영향**: TypeORM 설정에 따라 무시되거나 런타임 에러
- **수정 방향**: `provider` 필드 제거 (AuthIdentity에만 저장)

### 13. `issueAdminToken(email: number)` 파라미터 타입 오류

- **파일**: `src/api/auth/services/auth-token.service.ts:14`
- **현상**: email 파라미터 타입이 `number`로 선언됨
- **수정 방향**: `string`으로 수정

---

## 🟡 P2 — 중간 우선순위 (코드 품질·검증)

### 14. Haversine 거리 계산 SQL이 3곳에서 중복

- **파일**: `src/api/shop/repositories/shop.repository.ts:21-26, 88-94, 121-126`
- **수정 방향**: 헬퍼 함수/상수로 추출

### 15. 관리자 신고 조회 시 JS에서 수동 집계 (N+1)

- **파일**: `src/api/shop/shop.service.ts:290-323, 325-356`
- **현상**: 신고를 전건 조회 후 `forEach`로 shopId별 카운트 집계
- **수정 방향**: DB의 `GROUP BY + COUNT` 쿼리로 대체

### 16. S3 업로드 시 ContentType이 `image/jpg`로 하드코딩

- **파일**: `src/common/aws/aws.service.ts:45`
- **현상**: PNG·WebP 등 실제 파일 타입 무시
- **수정 방향**: `file.mimetype` 사용

### 17. S3 이미지 삭제 시 URL 파싱이 취약

- **파일**: `src/common/aws/aws.service.ts:65`
- **현상**: `.amazonaws.com/`으로 split → 형식이 다르면 `undefined`
- **수정 방향**: URL 형식 검증 추가, 혹은 key만 별도 저장

### 18. DTO 검증 누락 모음

| DTO | 파일 | 누락 항목 |
|-----|------|-----------|
| `UpdateProfileDTO` | `src/api/user/dto/requests/user_requests.dto.ts` | `nickName`에 `@Matches` 없음 (ValidateNickNameDTO에는 있음) |
| `SubmitShopDto` | `src/api/shop/dto/requests/submit_shop_requests.dto.ts` | `name`, `lat`, `lng`, `location` 검증 데코레이터 없음 |
| `OperatingHoursDto` | 동일 파일 | `phoneNumber` 길이 제한 없음, 시간 형식 검증 없음 |
| `ToggleReviewHiddenDto` | `src/api/admin/dto/request/toggle-review-hidden.dto.ts` | `@IsNotEmpty()` 누락 (ToggleShopHiddenDto에는 있음) |
| `ReviewReportDto` | `src/api/shop/dto/requests/report_request.ts` | `reportMessage`에 `@MaxLength` 없음 |

### 19. `addUserFavorite()` 메서드명이 실제 동작(토글)과 불일치

- **파일**: `src/api/user/user.service.ts:147-157`
- **현상**: 이미 즐겨찾기면 삭제, 없으면 추가 → **토글** 동작
- **수정 방향**: `toggleUserFavorite()`로 이름 변경, 또는 add/remove 분리

### 20. UserService 의존성 11개 — 과도한 책임

- **파일**: `src/api/user/user.service.ts:33-45`
- **수정 방향**: 프로필 관련 / 즐겨찾기 관련 / 탈퇴 관련으로 서비스 분리 검토

### 21. 트랜잭션 catch에서 원본 에러 미로깅

- **파일**:
  - `src/api/shop/repositories/shop-submit-transactions.repository.ts:44-46, 83-85`
  - `src/api/review/repositories/review-transactions.repository.ts:43-45, 101-106`
- **현상**: `catch (err)` 후 `err`를 로그하지 않고 `InternalServerErrorException()`만 throw
- **수정 방향**: `loggerService.logError()`로 원본 에러 기록 후 throw

### 22. Helmet CSP 비활성화 상태

- **파일**: `src/main.ts:29`
- **현상**: `contentSecurityPolicy: false` — 주석 처리된 CSP 설정이 있으나 미적용
- **수정 방향**: CSP 활성화

---

## 🟢 P3 — 낮은 우선순위 (네이밍·정리·컨벤션)

### 23. 스텁/미완성 모듈 정리

| 모듈 | 상태 | 조치 |
|------|------|------|
| `src/api/wishlist/` | 컨트롤러·DTO 모두 빈 파일 | 삭제 (기능은 User 모듈에 구현됨) |
| `src/api/recent-search/` | 서비스 파일 비어 있음 | 삭제 (기능은 Shop 모듈에 구현됨) |

### 24. 파일 네이밍 컨벤션 불일치

| 현재 | 문제 |
|------|------|
| `auth-transcation.service.ts` | "transaction" 오타 |
| `report_request.ts` | `.dto` 접미사 누락 (다른 DTO는 `.dto.ts`) |
| `region_response.ts` | `.dto` 접미사 누락 |
| DTO 파일들 | snake_case (`user_requests.dto.ts`) vs kebab-case (`notice-response.dto.ts`) 혼재 |

### 25. `SuccessResponseFilter` 네이밍 오류

- **파일**: `src/common/filter/success-response.filter.ts`
- **현상**: `NestInterceptor`를 구현하지만 클래스명은 `*Filter`, `filter/` 폴더에 위치
- **수정 방향**: `SuccessResponseInterceptor`로 이름 변경, `interceptor/` 폴더로 이동

### 26. TypeORM 관계 설정 오류

- **파일**: `src/api/auth/entities/auth-identity.entity.ts:11`
  - `@ManyToOne(() => User, (user) => user.uuid)` → inverse side는 관계 프로퍼티여야 함 (예: `user.authIdentities`)
- **파일**: `src/api/shop/entities/shop-product-mapping.entity.ts:20, 24`
  - `(product) => product.id`, `(shop) => shop.id` → 역시 관계 프로퍼티여야 함
- **파일**: `src/api/review/entities/review.entity.ts:21, 17`
  - 동일 패턴

### 27. 빈 enum·데드 코드 정리

| 파일 | 내용 |
|------|------|
| `src/common/enum/review-ban.enum.ts` | `BanReason` enum이 비어 있음 |
| `src/common/pipe/sanitize.pipe.ts` | 전체가 주석 처리 — 사용처 없음 |
| `src/api/review/repositories/review-ban.repository.ts:23-31` | `createReviewBan()` — "추후 사용 예정" 주석, 파라미터명이 엔티티 필드와 불일치 |

### 28. `any` 타입 사용

- **파일**: `src/api/review/review.service.ts:36, 59`
- **현상**: `review: any`, `reviews: any[]`
- **수정 방향**: `Review` 엔티티 또는 전용 인터페이스로 교체

### 29. `@Injectable()` 데코레이터 누락

- **파일**: `src/api/user/repositories/user.repository.ts`
- **현상**: NestJS Provider로 등록되지만 `@Injectable()` 데코레이터 없음
- **수정 방향**: 일부 Repository에 `@Injectable()` 추가 (일관성 확보)

### 30. `get-insta-id.ts` 파일명과 함수명(`getLastSegment`) 불일치

- **파일**: `src/common/function/get-insta-id.ts`
- **수정 방향**: 파일명을 `get-last-segment.ts`로 변경하거나 함수명 변경

### 31. `forbidNonWhitelisted: true` 주석 처리 상태

- **파일**: `src/common/pipe/validationPipe.pipe.ts:8`
- **현상**: DTO에 정의되지 않은 필드가 에러 없이 무시됨
- **수정 방향**: 활성화하여 예상치 못한 필드 전달 시 400 에러 반환

---

## 리팩토링 요약

| 우선순위 | 항목 수 | 핵심 키워드 |
|----------|---------|-------------|
| 🔴 P0 | 5 | 보안 취약점, 데이터 유실 위험, 민감정보 노출 |
| 🟠 P1 | 8 | 아키텍처 위반, 버그, 타입 오류 |
| 🟡 P2 | 9 | 코드 중복, 검증 누락, 성능 |
| 🟢 P3 | 9 | 네이밍, 데드코드, 컨벤션 |
| **합계** | **31** | |
