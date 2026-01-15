-- ============================================
-- Trait Seed Data (특성 초기 데이터)
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 기존 데이터 정리 (필요시 주석 해제)
-- DELETE FROM "department_traits";
-- DELETE FROM "user_traits";
-- DELETE FROM "traits";
-- DELETE FROM "departments";
-- DELETE FROM "schools";

-- ============================================
-- 1. Trait 테이블 INSERT (11개 특성)
-- ============================================

-- INTEREST (흥미) - 4개
INSERT INTO "traits" ("id", "name", "type", "created_at", "updated_at") VALUES
  ('trait_int_001', '실무지향', 'INTEREST', NOW(), NOW()),
  ('trait_int_002', '기계조작', 'INTEREST', NOW(), NOW()),
  ('trait_int_003', '수리흥미', 'INTEREST', NOW(), NOW()),
  ('trait_int_004', '현장적응', 'INTEREST', NOW(), NOW())
ON CONFLICT ("name", "type") DO NOTHING;

-- APTITUDE (적성) - 7개
INSERT INTO "traits" ("id", "name", "type", "created_at", "updated_at") VALUES
  ('trait_apt_001', '언어이해', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_002', '수리력', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_003', '공간지각', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_004', '문제해결', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_005', '창의력', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_006', '집중력', 'APTITUDE', NOW(), NOW()),
  ('trait_apt_007', '관찰탐구', 'APTITUDE', NOW(), NOW())
ON CONFLICT ("name", "type") DO NOTHING;

-- ============================================
-- 2. 테스트용 School & Department INSERT
-- ============================================

-- 수도전기공업고등학교
INSERT INTO "schools" ("id", "name", "foundation_type", "designation_th", "region", "created_at", "updated_at") VALUES
  ('school_001', '수도전기공업고등학교', '공립', '1차', '서울', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "departments" ("id", "name", "school_id", "created_at", "updated_at") VALUES
  ('dept_001', '전기과', 'school_001', NOW(), NOW()),
  ('dept_002', '전자과', 'school_001', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 평택기계공업고등학교
INSERT INTO "schools" ("id", "name", "foundation_type", "designation_th", "region", "created_at", "updated_at") VALUES
  ('school_002', '평택기계공업고등학교', '공립', '2차', '경기', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "departments" ("id", "name", "school_id", "created_at", "updated_at") VALUES
  ('dept_003', '기계과', 'school_002', NOW(), NOW()),
  ('dept_004', '자동화과', 'school_002', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 광주자동화설비공업고등학교
INSERT INTO "schools" ("id", "name", "foundation_type", "designation_th", "region", "created_at", "updated_at") VALUES
  ('school_003', '광주자동화설비공업고등학교', '공립', '1차', '광주', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "departments" ("id", "name", "school_id", "created_at", "updated_at") VALUES
  ('dept_005', '자동화설비과', 'school_003', NOW(), NOW()),
  ('dept_006', '스마트전자과', 'school_003', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 3. DepartmentTrait INSERT (학과별 적성 가중치)
-- ============================================

-- 수도전기공업고등학교 - 전기과 (dept_001)
-- 언어이해(3), 수리력(5), 공간지각(4), 문제해결(4)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_001_001', 'dept_001', 'trait_apt_001', 3, NOW(), NOW()),  -- 언어이해
  ('dt_001_002', 'dept_001', 'trait_apt_002', 5, NOW(), NOW()),  -- 수리력
  ('dt_001_003', 'dept_001', 'trait_apt_003', 4, NOW(), NOW()),  -- 공간지각
  ('dt_001_004', 'dept_001', 'trait_apt_004', 4, NOW(), NOW())   -- 문제해결
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 수도전기공업고등학교 - 전자과 (dept_002)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_002_001', 'dept_002', 'trait_apt_001', 3, NOW(), NOW()),  -- 언어이해
  ('dt_002_002', 'dept_002', 'trait_apt_002', 5, NOW(), NOW()),  -- 수리력
  ('dt_002_003', 'dept_002', 'trait_apt_003', 4, NOW(), NOW()),  -- 공간지각
  ('dt_002_004', 'dept_002', 'trait_apt_004', 4, NOW(), NOW())   -- 문제해결
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 평택기계공업고등학교 - 기계과 (dept_003)
-- 언어이해(3), 수리력(5), 공간지각(5), 집중력(3)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_003_001', 'dept_003', 'trait_apt_001', 3, NOW(), NOW()),  -- 언어이해
  ('dt_003_002', 'dept_003', 'trait_apt_002', 5, NOW(), NOW()),  -- 수리력
  ('dt_003_003', 'dept_003', 'trait_apt_003', 5, NOW(), NOW()),  -- 공간지각
  ('dt_003_004', 'dept_003', 'trait_apt_006', 3, NOW(), NOW())   -- 집중력
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 평택기계공업고등학교 - 자동화과 (dept_004)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_004_001', 'dept_004', 'trait_apt_001', 3, NOW(), NOW()),  -- 언어이해
  ('dt_004_002', 'dept_004', 'trait_apt_002', 5, NOW(), NOW()),  -- 수리력
  ('dt_004_003', 'dept_004', 'trait_apt_003', 5, NOW(), NOW()),  -- 공간지각
  ('dt_004_004', 'dept_004', 'trait_apt_006', 3, NOW(), NOW())   -- 집중력
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 광주자동화설비공업고등학교 - 자동화설비과 (dept_005)
-- 관찰탐구(4), 공간지각(5), 창의력(5)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_005_001', 'dept_005', 'trait_apt_007', 4, NOW(), NOW()),  -- 관찰탐구
  ('dt_005_002', 'dept_005', 'trait_apt_003', 5, NOW(), NOW()),  -- 공간지각
  ('dt_005_003', 'dept_005', 'trait_apt_005', 5, NOW(), NOW())   -- 창의력
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 광주자동화설비공업고등학교 - 스마트전자과 (dept_006)
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_006_001', 'dept_006', 'trait_apt_007', 4, NOW(), NOW()),  -- 관찰탐구
  ('dt_006_002', 'dept_006', 'trait_apt_003', 5, NOW(), NOW()),  -- 공간지각
  ('dt_006_003', 'dept_006', 'trait_apt_005', 5, NOW(), NOW())   -- 창의력
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- ============================================
-- 4. 흥미(INTEREST) 특성도 학과에 매핑 (선택적)
-- ============================================

-- 전기/전자 계열 학과는 '수리흥미', '기계조작' 관련성 높음
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_001_int_001', 'dept_001', 'trait_int_002', 4, NOW(), NOW()),  -- 기계조작
  ('dt_001_int_002', 'dept_001', 'trait_int_003', 5, NOW(), NOW()),  -- 수리흥미
  ('dt_002_int_001', 'dept_002', 'trait_int_002', 4, NOW(), NOW()),  -- 기계조작
  ('dt_002_int_002', 'dept_002', 'trait_int_003', 5, NOW(), NOW())   -- 수리흥미
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 기계/자동화 계열 학과는 '기계조작', '현장적응' 관련성 높음
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_003_int_001', 'dept_003', 'trait_int_002', 5, NOW(), NOW()),  -- 기계조작
  ('dt_003_int_002', 'dept_003', 'trait_int_004', 4, NOW(), NOW()),  -- 현장적응
  ('dt_004_int_001', 'dept_004', 'trait_int_002', 5, NOW(), NOW()),  -- 기계조작
  ('dt_004_int_002', 'dept_004', 'trait_int_004', 4, NOW(), NOW())   -- 현장적응
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- 자동화설비/스마트전자 계열은 '실무지향', '기계조작' 관련성 높음
INSERT INTO "department_traits" ("id", "department_id", "trait_id", "weight", "created_at", "updated_at") VALUES
  ('dt_005_int_001', 'dept_005', 'trait_int_001', 5, NOW(), NOW()),  -- 실무지향
  ('dt_005_int_002', 'dept_005', 'trait_int_002', 4, NOW(), NOW()),  -- 기계조작
  ('dt_006_int_001', 'dept_006', 'trait_int_001', 5, NOW(), NOW()),  -- 실무지향
  ('dt_006_int_002', 'dept_006', 'trait_int_002', 4, NOW(), NOW())   -- 기계조작
ON CONFLICT ("department_id", "trait_id") DO UPDATE SET "weight" = EXCLUDED."weight";

-- ============================================
-- 완료! 데이터 확인 쿼리
-- ============================================

-- Trait 확인
-- SELECT * FROM "traits" ORDER BY "type", "name";

-- School/Department 확인
-- SELECT s.name as school, d.name as department 
-- FROM "schools" s 
-- JOIN "departments" d ON s.id = d.school_id;

-- DepartmentTrait 확인
-- SELECT d.name as department, t.name as trait, t.type, dt.weight
-- FROM "department_traits" dt
-- JOIN "departments" d ON dt.department_id = d.id
-- JOIN "traits" t ON dt.trait_id = t.id
-- ORDER BY d.name, t.type, dt.weight DESC;

