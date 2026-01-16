# 데이터베이스 마이그레이션 가이드

## 개요

꼭고 랜딩페이지의 데이터베이스 구조를 개선하여 성능과 확장성을 향상시켰습니다.

---

## 주요 변경사항

### 1. ID 타입 변경

| 테이블 | 변경 전 | 변경 후 |
|--------|---------|---------|
| schools | `text` ("school_7010271") | `bigserial` (1, 2, 3...) |
| traits | `text` ("trait_apt_001") | `bigserial` |
| departments | `text` | → majors, school_departments로 분리 |
| pre_orders | `phone` (PK) | `bigserial` (PK), `phone` (UNIQUE) |

**장점:**
- 인덱싱 성능 향상 (정수 비교가 문자열 비교보다 빠름)
- JOIN 연산 최적화
- 메모리 사용량 감소

---

### 2. 학과 테이블 구조 (하이브리드)

**변경 전:** 1:N 관계
```
schools (1) ─────< departments (N)
                   └── 같은 학과명이 학교마다 중복
```

**변경 후:** M:N 관계 (하이브리드)
```
schools (N) ─────< school_departments >───── majors (M)
                         │
                         └── custom_name, quota 등 학교별 정보
```

**테이블 설명:**

| 테이블 | 역할 |
|--------|------|
| `majors` | 정규화된 학과 정보 (중복 없음) |
| `school_departments` | 학교-학과 연결 + 학교별 커스텀 정보 |
| `major_traits` | 학과별 특성 연결 (평균 가중치) |

---

## 마이그레이션 파일

```
prisma/
├── schema.prisma          # Prisma 스키마 정의
├── migration_hybrid.sql   # 마이그레이션 SQL (Supabase에서 실행)
└── verify_hybrid.sql      # 마이그레이션 검증 쿼리
```

---

## 마이그레이션 실행 방법

### 1. Supabase SQL Editor에서 실행

```sql
-- migration_hybrid.sql 내용을 복사하여 실행
-- 단계별로 실행하거나 전체 실행 가능
```

### 2. 마이그레이션 검증

```sql
-- verify_hybrid.sql 내용을 실행하여 결과 확인
```

---

## 스키마 구조

### majors 테이블
```sql
CREATE TABLE majors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  ncs_code VARCHAR(50),
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### school_departments 테이블
```sql
CREATE TABLE school_departments (
  id BIGSERIAL PRIMARY KEY,
  school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
  major_id BIGINT REFERENCES majors(id) ON DELETE CASCADE,
  custom_name VARCHAR(255),  -- 학교별 커스텀 학과명
  quota INT,                  -- 정원
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(school_id, major_id)
);
```

### major_traits 테이블
```sql
CREATE TABLE major_traits (
  id BIGSERIAL PRIMARY KEY,
  major_id BIGINT REFERENCES majors(id) ON DELETE CASCADE,
  trait_id BIGINT REFERENCES traits(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(major_id, trait_id)
);
```

---

## RLS (Row Level Security) 설정

Supabase에서 새 테이블 생성 시 RLS가 기본 활성화됩니다.
공개 데이터 테이블은 아래와 같이 비활성화하세요:

```sql
-- 읽기 전용 공개 데이터
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE majors DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE traits DISABLE ROW LEVEL SECURITY;
ALTER TABLE major_traits DISABLE ROW LEVEL SECURITY;

-- 사용자 데이터 (INSERT 허용)
ALTER TABLE pre_orders DISABLE ROW LEVEL SECURITY;
```

---

## API 변경사항

### `/api/schools` (GET)

**요청:**
```
GET /api/schools?majors=소프트웨어과,인공지능과&region=Seoul
```

**응답:**
```json
{
  "success": true,
  "data": {
    "소프트웨어과": [
      {
        "schoolName": "서울디지털고등학교",
        "address": "서울특별시 영등포구",
        "employmentRate": 85.5,
        "enrollmentRate": 12.3,
        "graduates": 120,
        "surveyYear": "2024",
        "schoolType": "특성화고"
      }
    ]
  }
}
```

---

## 트러블슈팅

### Q: "cannot drop constraint schools_pkey" 에러
**A:** FK 의존성 때문입니다. `DROP ... CASCADE` 사용:
```sql
ALTER TABLE schools DROP CONSTRAINT schools_pkey CASCADE;
```

### Q: 학교명이 안 보여요
**A:** RLS가 활성화되어 있습니다. 테이블 RLS를 비활성화하세요.

### Q: INSERT 에러 (pre_orders)
**A:** RLS 문제입니다. `ALTER TABLE pre_orders DISABLE ROW LEVEL SECURITY;`

---

## 참고 링크

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

