# 소품샵 제보 — 주소/지역(region) 처리 가이드

## 0. region 테이블 구조

`region` 테이블은 **전국 17개 시/도를 2자 표준명**으로 보관한다.

| id | name | id | name | id | name |
|----|------|----|------|----|------|
| 1 | 서울 | 7 | 인천 | 13 | 충북 |
| 2 | 대전 | 8 | 광주 | 14 | 전북 |
| 3 | 대구 | 9 | 울산 | 15 | 전남 |
| 4 | 충남 | 10 | 세종 | 16 | 경북 |
| 5 | 제주 | 11 | 경기 | 17 | 경남 |
| 6 | 부산 | 12 | 강원 |    |      |

> id 1~5는 기존 데이터(서울/대전/대구/제주 + 기존 "천안"을 "충남"으로 통합), 6~17은 추가분.
> 모든 한국 주소는 시/도(`region_1depth_name`) 기준으로 이 17개 중 하나에 정확히 매핑된다.

---

## 1. 배경: 기존 방식의 문제

소품샵 제보(`POST /shops`) 시, 서버는 클라이언트가 보낸 `location` 문자열의 **앞 두 글자**를
잘라 region 테이블의 `name`과 매칭했다.

```ts
// region.repository.ts (기존)
async findRegionByLocation(location: string) {
  const regionName = location[0] + location[1]; // "서울시 성동구..." → "서울"
  return this.regionRepository.findOne({ where: { name: regionName } });
}
```

### 왜 깨지는가

`region` 테이블은 시/도를 2자 표준명(`서울`, `충남`, `충북` …)으로 저장하는데, `location`은
클라이언트가 자유롭게 채우는 표시용 문자열이라 앞 2글자가 이와 일치한다는 보장이 없다.

| 입력된 location | 앞 2글자 | 기대값 | 결과 |
|---|---|---|---|
| `서울시 성동구 …` | `서울` | `서울` | ✅ 우연히 맞음 |
| `충청남도 천안시 …` | `충청` | `충남` | ❌ 매칭 실패 |
| `전라남도 여수시 …` | `전라` | `전남` | ❌ 매칭 실패 |
| `경상북도 …` | `경상` | `경북` | ❌ 매칭 실패 |
| `왕십리로 222` (도로명만) | `왕십` | `서울` | ❌ 매칭 실패 |
| ` 서울 …` (앞 공백) | ` 서` | `서울` | ❌ 매칭 실패 |

즉 **충청/전라/경상 도 지역은 구조적으로 항상 실패**하고, 도로명만 입력되거나 공백/표기가
조금만 달라져도 깨진다. "주소 문자열 앞 2글자로 추측"하는 접근 자체가 문제다.

---

## 2. 올바른 방법: 지오코더가 분해해 준 행정구역을 그대로 사용

주소를 직접 파싱하지 말고, **지도/지오코딩 제공자(Kakao)가 분해해 준 행정구역 필드를
그대로 받아서** 매칭한다. 이 서비스는 이미 클라이언트가 Kakao Map으로 장소를 선택하므로,
Kakao가 내려주는 시/도(`region_1depth_name`)를 함께 보내면 추측이 필요 없다.

### 다른 서비스들은 어떻게 하나 (일반적인 패턴)

- **클라이언트가 지도 SDK로 장소를 선택** → 지오코더가 좌표(x/y), 도로명/지번 주소,
  그리고 **분해된 행정구역(시도·시군구·읍면동)** 을 함께 반환한다.
- 서버는 주소 문자열을 파싱하지 않고, 이 **구조화된 필드**를 그대로 매칭/저장한다.
- 더 견고하게 가려는 곳은 **법정동코드(b_code) 또는 행정동코드(h_code)** 를 함께 저장한다.
  코드는 표기가 바뀌어도("강원도"→"강원특별자치도") 변하지 않아 가장 안정적인 조인 키다.
- 신뢰가 더 필요한 서비스는 클라이언트 값을 믿지 않고, **서버가 좌표(lat/lng)로
  역지오코딩**(Kakao `coord2regioncode`)하여 행정구역을 직접 확정한다.

이 가이드는 **클라이언트가 Kakao 시/도(region_1depth_name)를 전달 → 서버가 2자 표준명으로
정규화 후 매칭**을 1차 방식으로 채택한다. (서버 외부 호출/키 불필요, 지연 없음, 제보는
어차피 관리자 승인 단계를 거침) 서버 측 역지오코딩은 4절에 향후 강화안으로 정리한다.

---

## 3. 채택한 방식 (현재 구현)

### 3-1. 클라이언트: Kakao에서 주소 데이터 받기

클라이언트는 Kakao Local API(또는 Maps SDK의 동일 기능)로 장소를 검색/선택한다.

**키워드로 장소 검색** — `GET https://dapi.kakao.com/v2/local/search/keyword.json`

```
Authorization: KakaoAK {REST_API_KEY}
?query=소소한 소품샵
```

응답(`documents[]`)에서 한 장소를 고르면 다음 값을 얻는다.

```jsonc
{
  "place_name": "소소한 소품샵",
  "road_address_name": "충남 천안시 동남구 …",   // 도로명주소
  "address_name": "충남 천안시 동남구 …",          // 지번주소
  "x": "127.123456",   // 경도(lng)
  "y": "37.123456"     // 위도(lat)
}
```

> 키워드 검색 문서에 시/도가 분리돼 있지 않으면, 선택한 좌표(x,y)로
> **주소 검색**(`/v2/local/search/address.json`) 또는
> **좌표→행정구역**(`/v2/local/geo/coord2regioncode.json`)을 한 번 더 호출해
> `region_1depth_name`(시/도)을 얻는다. coord2regioncode 응답 예:
>
> ```jsonc
> {
>   "region_1depth_name": "충청남도",   // 시/도  ← 서버로 전달
>   "region_2depth_name": "천안시 동남구",
>   "region_3depth_name": "신부동",
>   "code": "4413110100"                // 법정동코드(b_code)
> }
> ```

> ⚠️ Kakao는 API 종류에 따라 시/도를 **축약형("충남")** 또는 **전체명("충청남도")** 으로
> 내려준다. 서버 정규화가 두 형태를 모두 처리하므로 클라이언트는 받은 값을 그대로 보내면 된다.

### 3-2. 클라이언트 → 서버 요청

`POST /v2/api/shops` (JWT 필요)

```jsonc
{
  "shop": {
    "name": "소소한 상점",
    "lat": 37.123456,                   // Kakao y
    "lng": 127.123456,                  // Kakao x
    "location": "충남 천안시 동남구 …",  // 표시용 주소(도로명 우선, 없으면 지번)
    "region1DepthName": "충청남도"       // Kakao region_1depth_name (시/도)
  },
  "operatingHours": { /* 선택 */ },
  "products": [ { "id": 1 } ]           // 선택
}
```

- `region1DepthName`(필수): **지역 매칭 전용**. 축약형("충남")/전체명("충청남도") 모두 허용.
- `location`: 화면 표시용. 매칭에는 더 이상 사용하지 않는다.

### 3-3. 서버 처리

```
region1DepthName ──normalizeRegionName()──▶ 2자 표준명 ──findRegionByName()──▶ region FK
   "충청남도"                                  "충남"                             region.id (4)
```

1. `normalizeRegionName()`이 Kakao 시/도 이름(축약형/전체명)을 region 테이블 2자 표준명으로
   정규화한다. 17개 시/도의 알려진 표기를 모두 매핑한다.
2. 매핑 실패 시 `400 BadRequest`.
3. 정규화된 이름으로 `findRegionByName()` 조회. 없으면 `404 NotFound`.
4. 찾은 `region.id`를 FK로 소품샵을 생성한다(제보는 `Pending` 상태 → 관리자 승인).

#### 정규화 매핑 (요약)

| Kakao 입력 (예시) | 표준 이름 |
|---|---|
| `서울특별시` / `서울` | `서울` |
| `부산광역시` / `부산` | `부산` |
| `세종특별자치시` / `세종` | `세종` |
| `경기도` / `경기` | `경기` |
| `강원특별자치도` / `강원도` / `강원` | `강원` |
| `충청북도` / `충북` | `충북` |
| `충청남도` / `충남` | `충남` |
| `전북특별자치도` / `전라북도` / `전북` | `전북` |
| `전라남도` / `전남` | `전남` |
| `경상북도` / `경북` | `경북` |
| `경상남도` / `경남` | `경남` |
| `제주특별자치도` / `제주도` / `제주` | `제주` |

(광역시·특별시 7개, 특별자치시/도, 일반 도 포함 총 17개 시/도)

관련 코드:

- `src/common/function/normalize-region-name.function.ts` — `normalizeRegionName()`
- `src/api/region/region.repository.ts` — `findRegionByName(name)`
- `src/api/shop/shop.service.ts` — `createNewShop()` 검증/매칭
- `src/api/shop/dto/requests/submit_shop_requests.dto.ts` — `region1DepthName` 필드 + 중첩 검증

---

## 4. 향후 강화안 (선택)

클라이언트 값을 신뢰하지 않고 서버에서 행정구역을 확정하려면, 좌표 기반 역지오코딩을 둔다.

- 서버에 Kakao REST 키(`KAKAO_REST_API_KEY`)를 추가하고,
- `coord2regioncode`(`GET /v2/local/geo/coord2regioncode.json?x={lng}&y={lat}`)를 호출해
  `region_1depth_name`을 서버가 직접 얻은 뒤 동일하게 `normalizeRegionName()`으로 매칭.
- 또는 응답의 `code`(법정동코드) **앞 2자리**로 시/도를 판별하면 표기 변화에 가장 강하다.
  (이 경우 region 테이블에 코드 컬럼을 추가해 코드로 조인하는 것을 권장)

> 트레이드오프: 외부 호출 1회 추가(지연·실패 처리·요청 쿼터), Kakao 키 운영 필요.
> 현재는 제보가 관리자 승인을 거치므로 1차 방식으로 충분하다고 판단했다.

---

## 참고 자료

- [Kakao Developers — Local REST API 가이드](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [Kakao Developers — Local 공통 개념(좌표/주소)](https://developers.kakao.com/docs/latest/ko/local/common)
