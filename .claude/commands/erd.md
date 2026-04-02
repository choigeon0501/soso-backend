DB 스키마 변경 시 기존 스키마와 변경된 스키마에 대한 ERD를 dbdiagram.io에서 사용 가능한 DBML 코드로 추출하여 파일로 저장해줘.

## 작업 순서

1. **현재 스키마 파악**: TypeORM 엔티티(`*.entity.ts`)를 읽어 테이블·컬럼·관계를 파악
2. **erd/ 폴더**: 프로젝트 루트에 `erd/`가 없을 때만 생성
3. **previous-erd.dbml**: 변경 전(현재) 스키마를 DBML로 작성 → `erd/previous-erd.dbml`
4. **new-erd.dbml**: 변경 후(목표) 스키마를 DBML로 작성 → `erd/new-erd.dbml`

## DBML 작성 규칙

- **테이블**: `Table 테이블명 { 컬럼 타입 [설정], ... }`
- **컬럼 설정**: `[pk]`, `[not null]`, `[unique]`, `[default: 값]`, `[note: '설명']`
- **관계**: FK 컬럼에는 `[not null]` 등만 쓰고, 관계는 파일 하단에서 `Ref:` 한 줄로만 정의
  - 같은 관계를 인라인(`ref:`)과 `Ref:` 둘 다 쓰면 오류 발생
- **관계 기호**: `>` (many-to-one), `<` (one-to-many), `-` (one-to-one), `<>` (many-to-many)
- **기본값**: 숫자 그대로, 문자열 `'...'`, 함수 `` `now()` ``

## 출력 예시

```dbml
Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer [not null]
  status varchar
  created_at timestamp
}

Ref: posts.user_id > users.id
```

## 참고

- dbdiagram.io에 붙여넣었을 때 오류 없이 렌더링되도록 문법을 맞출 것
- Records(샘플 데이터)가 필요하면 `Records 테이블명(컬럼들) { ... }` 형태로 추가
- 문자열/날짜는 작은따옴표 (예: `'2026-01-01'`)
