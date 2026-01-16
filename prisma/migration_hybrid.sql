-- ============================================
-- 하이브리드 구조 통합 마이그레이션
-- ID 개선 (bigserial) + 학과 구조 정규화
-- Supabase SQL Editor에서 STEP별로 실행하세요
-- ============================================

-- ============================================
-- STEP 0: 백업 확인 (실행 전 반드시 확인!)
-- ============================================
-- SELECT COUNT(*) as schools_count FROM schools;
-- SELECT COUNT(*) as departments_count FROM departments;
-- SELECT COUNT(*) as traits_count FROM traits;
-- SELECT COUNT(*) as department_traits_count FROM department_traits;

-- ============================================
-- STEP 1: 시퀀스 생성
-- ============================================

CREATE SEQUENCE IF NOT EXISTS schools_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS majors_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS school_departments_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS traits_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS major_traits_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS admission_rules_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS target_companies_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pre_orders_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_traits_id_seq START 1;

-- ============================================
-- STEP 2: majors 테이블 생성 (학과 유형 - 공통 정보)
-- ============================================

CREATE TABLE IF NOT EXISTS majors (
  id bigint PRIMARY KEY DEFAULT nextval('majors_id_seq'),
  name text NOT NULL UNIQUE,
  ncs_code text,
  category text,
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_majors_name ON majors(name);
CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category);

-- ============================================
-- STEP 3: departments에서 majors로 데이터 추출 (중복 제거)
-- ============================================

INSERT INTO majors (name, description)
SELECT DISTINCT 
  name,
  MAX(description) as description  -- 설명이 있으면 가져옴
FROM departments
GROUP BY name
ON CONFLICT (name) DO NOTHING;

-- 결과 확인
-- SELECT * FROM majors ORDER BY name LIMIT 20;

-- ============================================
-- STEP 4: school_departments 테이블 생성 (학교-학과 연결)
-- ============================================

CREATE TABLE IF NOT EXISTS school_departments (
  id bigint PRIMARY KEY DEFAULT nextval('school_departments_id_seq'),
  school_id bigint NOT NULL,
  major_id bigint NOT NULL,
  custom_name text,  -- 학교별 커스텀 학과명 (예: 스마트전기과)
  quota integer,     -- 모집 정원
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(school_id, major_id)
);

CREATE INDEX IF NOT EXISTS idx_school_departments_school_id ON school_departments(school_id);
CREATE INDEX IF NOT EXISTS idx_school_departments_major_id ON school_departments(major_id);

-- ============================================
-- STEP 5: major_traits 테이블 생성 (학과 유형별 적성)
-- ============================================

CREATE TABLE IF NOT EXISTS major_traits (
  id bigint PRIMARY KEY DEFAULT nextval('major_traits_id_seq'),
  major_id bigint NOT NULL,
  trait_id bigint NOT NULL,
  weight float NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(major_id, trait_id)
);

CREATE INDEX IF NOT EXISTS idx_major_traits_major_id ON major_traits(major_id);
CREATE INDEX IF NOT EXISTS idx_major_traits_trait_id ON major_traits(trait_id);

-- ============================================
-- STEP 6: Schools 테이블 ID 변환 준비
-- ============================================

-- 6.1 새 컬럼 추가
ALTER TABLE schools ADD COLUMN IF NOT EXISTS new_id bigint;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS admin_code text;

-- 6.2 기존 id에서 행정표준코드 추출
UPDATE schools 
SET admin_code = REPLACE(id, 'school_', '')
WHERE admin_code IS NULL;

-- 6.3 새 ID 할당
UPDATE schools 
SET new_id = nextval('schools_id_seq')
WHERE new_id IS NULL;

-- 결과 확인
-- SELECT id, new_id, admin_code, name FROM schools LIMIT 10;

-- ============================================
-- STEP 7: Traits 테이블 ID 변환 준비
-- ============================================

ALTER TABLE traits ADD COLUMN IF NOT EXISTS new_id bigint;

UPDATE traits 
SET new_id = nextval('traits_id_seq')
WHERE new_id IS NULL;

-- 결과 확인
-- SELECT id, new_id, name, type FROM traits;

-- ============================================
-- STEP 8: school_departments 데이터 채우기
-- ============================================

-- departments 데이터를 school_departments로 변환
INSERT INTO school_departments (school_id, major_id, custom_name)
SELECT 
  s.new_id as school_id,
  m.id as major_id,
  CASE 
    WHEN d.name != m.name THEN d.name  -- 이름이 다르면 커스텀 이름
    ELSE NULL 
  END as custom_name
FROM departments d
JOIN schools s ON d.school_id = s.id
JOIN majors m ON d.name = m.name
ON CONFLICT (school_id, major_id) DO NOTHING;

-- 결과 확인
-- SELECT sd.id, s.name as school, m.name as major, sd.custom_name
-- FROM school_departments sd
-- JOIN schools s ON sd.school_id = s.new_id
-- JOIN majors m ON sd.major_id = m.id
-- LIMIT 20;

-- ============================================
-- STEP 9: major_traits 데이터 채우기
-- ============================================

-- department_traits를 major_traits로 통합 (같은 학과명의 가중치 평균)
INSERT INTO major_traits (major_id, trait_id, weight)
SELECT 
  m.id as major_id,
  t.new_id as trait_id,
  AVG(dt.weight) as weight  -- 여러 학교의 같은 학과에서 평균 가중치
FROM department_traits dt
JOIN departments d ON dt.department_id = d.id
JOIN majors m ON d.name = m.name
JOIN traits t ON dt.trait_id = t.id
GROUP BY m.id, t.new_id
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- 결과 확인
-- SELECT m.name as major, t.name as trait, mt.weight
-- FROM major_traits mt
-- JOIN majors m ON mt.major_id = m.id
-- JOIN traits t ON mt.trait_id = t.new_id
-- ORDER BY m.name, mt.weight DESC
-- LIMIT 20;

-- ============================================
-- STEP 10: admission_rules FK 변환 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admission_rules') THEN
    -- 새 컬럼 추가
    ALTER TABLE admission_rules ADD COLUMN IF NOT EXISTS new_id bigint;
    ALTER TABLE admission_rules ADD COLUMN IF NOT EXISTS school_department_id bigint;
    
    -- 새 ID 할당
    UPDATE admission_rules 
    SET new_id = nextval('admission_rules_id_seq')
    WHERE new_id IS NULL;
    
    -- school_department_id 매핑
    UPDATE admission_rules ar
    SET school_department_id = sd.id
    FROM departments d
    JOIN schools s ON d.school_id = s.id
    JOIN majors m ON d.name = m.name
    JOIN school_departments sd ON sd.school_id = s.new_id AND sd.major_id = m.id
    WHERE ar.department_id = d.id
    AND ar.school_department_id IS NULL;
  END IF;
END $$;

-- ============================================
-- STEP 11: target_companies FK 변환 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_companies') THEN
    -- 새 컬럼 추가
    ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS new_id bigint;
    ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS school_department_id bigint;
    
    -- 새 ID 할당
    UPDATE target_companies 
    SET new_id = nextval('target_companies_id_seq')
    WHERE new_id IS NULL;
    
    -- school_department_id 매핑
    UPDATE target_companies tc
    SET school_department_id = sd.id
    FROM departments d
    JOIN schools s ON d.school_id = s.id
    JOIN majors m ON d.name = m.name
    JOIN school_departments sd ON sd.school_id = s.new_id AND sd.major_id = m.id
    WHERE tc.department_id = d.id
    AND tc.school_department_id IS NULL;
  END IF;
END $$;

-- ============================================
-- STEP 12: pre_orders 테이블 재생성 (테스트 데이터)
-- ============================================

DROP TABLE IF EXISTS pre_orders CASCADE;

CREATE TABLE pre_orders (
  id bigint PRIMARY KEY DEFAULT nextval('pre_orders_id_seq'),
  phone text NOT NULL UNIQUE,
  major text,
  result_type text,
  marketing_consent boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_orders_phone ON pre_orders(phone);
CREATE INDEX IF NOT EXISTS idx_pre_orders_created_at ON pre_orders(created_at);

-- ============================================
-- STEP 13: 기존 FK 제약조건 삭제
-- ============================================

-- departments FK
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_school_id_fkey;

-- department_traits FK
ALTER TABLE department_traits DROP CONSTRAINT IF EXISTS department_traits_department_id_fkey;
ALTER TABLE department_traits DROP CONSTRAINT IF EXISTS department_traits_trait_id_fkey;

-- admission_rules FK
ALTER TABLE admission_rules DROP CONSTRAINT IF EXISTS admission_rules_department_id_fkey;

-- target_companies FK
ALTER TABLE target_companies DROP CONSTRAINT IF EXISTS target_companies_department_id_fkey;

-- user_traits FK (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_traits') THEN
    ALTER TABLE user_traits DROP CONSTRAINT IF EXISTS user_traits_trait_id_fkey;
    ALTER TABLE user_traits DROP CONSTRAINT IF EXISTS user_traits_user_id_fkey;
  END IF;
END $$;

-- ============================================
-- STEP 14: 기존 PK 제약조건 삭제 (CASCADE 사용)
-- ============================================

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_pkey CASCADE;
ALTER TABLE traits DROP CONSTRAINT IF EXISTS traits_pkey CASCADE;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admission_rules') THEN
    ALTER TABLE admission_rules DROP CONSTRAINT IF EXISTS admission_rules_pkey CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_companies') THEN
    ALTER TABLE target_companies DROP CONSTRAINT IF EXISTS target_companies_pkey CASCADE;
  END IF;
END $$;

-- ============================================
-- STEP 15: Schools 테이블 ID 교체
-- ============================================

-- 기존 id 컬럼 삭제
ALTER TABLE schools DROP COLUMN id;

-- new_id를 id로 rename
ALTER TABLE schools RENAME COLUMN new_id TO id;

-- PK 설정
ALTER TABLE schools ADD PRIMARY KEY (id);
ALTER TABLE schools ALTER COLUMN id SET DEFAULT nextval('schools_id_seq');

-- admin_code UNIQUE 설정
ALTER TABLE schools ADD CONSTRAINT schools_admin_code_key UNIQUE (admin_code);

-- ============================================
-- STEP 16: Traits 테이블 ID 교체
-- ============================================

-- 기존 id 컬럼 삭제
ALTER TABLE traits DROP COLUMN id;

-- new_id를 id로 rename
ALTER TABLE traits RENAME COLUMN new_id TO id;

-- PK 설정
ALTER TABLE traits ADD PRIMARY KEY (id);
ALTER TABLE traits ALTER COLUMN id SET DEFAULT nextval('traits_id_seq');

-- ============================================
-- STEP 17: admission_rules 테이블 변환 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admission_rules' AND column_name = 'new_id') THEN
    -- 기존 id 컬럼 삭제
    ALTER TABLE admission_rules DROP COLUMN IF EXISTS id;
    
    -- 기존 department_id 컬럼 삭제 (있는 경우)
    ALTER TABLE admission_rules DROP COLUMN IF EXISTS department_id;
    
    -- new_id를 id로 rename
    ALTER TABLE admission_rules RENAME COLUMN new_id TO id;
    
    -- PK 설정
    ALTER TABLE admission_rules ADD PRIMARY KEY (id);
    ALTER TABLE admission_rules ALTER COLUMN id SET DEFAULT nextval('admission_rules_id_seq');
  END IF;
END $$;
-- ============================================
-- STEP 18: target_companies 테이블 변환 (존재하는 경우)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'target_companies' AND column_name = 'new_id') THEN
    -- 기존 id 컬럼 삭제
    ALTER TABLE target_companies DROP COLUMN IF EXISTS id;
    
    -- 기존 department_id 컬럼 삭제 (있는 경우)
    ALTER TABLE target_companies DROP COLUMN IF EXISTS department_id;
    
    -- new_id를 id로 rename
    ALTER TABLE target_companies RENAME COLUMN new_id TO id;
    
    -- PK 설정
    ALTER TABLE target_companies ADD PRIMARY KEY (id);
    ALTER TABLE target_companies ALTER COLUMN id SET DEFAULT nextval('target_companies_id_seq');
  END IF;
END $$;

-- ============================================
-- STEP 19: 기존 departments, department_traits 테이블 삭제
-- ============================================

DROP TABLE IF EXISTS department_traits CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================
-- STEP 20: FK 제약조건 재생성
-- ============================================

-- school_departments FK
ALTER TABLE school_departments 
ADD CONSTRAINT school_departments_school_id_fkey 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE school_departments 
ADD CONSTRAINT school_departments_major_id_fkey 
FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE;

-- major_traits FK
ALTER TABLE major_traits 
ADD CONSTRAINT major_traits_major_id_fkey 
FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE;

ALTER TABLE major_traits 
ADD CONSTRAINT major_traits_trait_id_fkey 
FOREIGN KEY (trait_id) REFERENCES traits(id) ON DELETE CASCADE;

-- admission_rules FK (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admission_rules' AND column_name = 'school_department_id') THEN
    ALTER TABLE admission_rules 
    ADD CONSTRAINT admission_rules_school_department_id_fkey 
    FOREIGN KEY (school_department_id) REFERENCES school_departments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- target_companies FK (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'target_companies' AND column_name = 'school_department_id') THEN
    ALTER TABLE target_companies 
    ADD CONSTRAINT target_companies_school_department_id_fkey 
    FOREIGN KEY (school_department_id) REFERENCES school_departments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- STEP 21: 인덱스 정리 및 재생성
-- ============================================

-- Schools 인덱스
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_school_type ON schools(school_type);
CREATE INDEX IF NOT EXISTS idx_schools_admin_code ON schools(admin_code);
CREATE INDEX IF NOT EXISTS idx_schools_region ON schools(region);

-- Traits 인덱스
CREATE INDEX IF NOT EXISTS idx_traits_type ON traits(type);
CREATE INDEX IF NOT EXISTS idx_traits_name ON traits(name);

-- ============================================
-- STEP 22: 시퀀스 현재값 조정
-- ============================================

SELECT setval('schools_id_seq', COALESCE((SELECT MAX(id) FROM schools), 0) + 1, false);
SELECT setval('majors_id_seq', COALESCE((SELECT MAX(id) FROM majors), 0) + 1, false);
SELECT setval('school_departments_id_seq', COALESCE((SELECT MAX(id) FROM school_departments), 0) + 1, false);
SELECT setval('traits_id_seq', COALESCE((SELECT MAX(id) FROM traits), 0) + 1, false);
SELECT setval('major_traits_id_seq', COALESCE((SELECT MAX(id) FROM major_traits), 0) + 1, false);
SELECT setval('pre_orders_id_seq', COALESCE((SELECT MAX(id) FROM pre_orders), 0) + 1, false);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admission_rules') THEN
    PERFORM setval('admission_rules_id_seq', COALESCE((SELECT MAX(id) FROM admission_rules), 0) + 1, false);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_companies') THEN
    PERFORM setval('target_companies_id_seq', COALESCE((SELECT MAX(id) FROM target_companies), 0) + 1, false);
  END IF;
END $$;

-- ============================================
-- 마이그레이션 완료!
-- ============================================

-- 최종 확인 쿼리
-- SELECT 'schools' as table_name, COUNT(*) as count FROM schools
-- UNION ALL SELECT 'majors', COUNT(*) FROM majors
-- UNION ALL SELECT 'school_departments', COUNT(*) FROM school_departments
-- UNION ALL SELECT 'traits', COUNT(*) FROM traits
-- UNION ALL SELECT 'major_traits', COUNT(*) FROM major_traits
-- UNION ALL SELECT 'pre_orders', COUNT(*) FROM pre_orders;

