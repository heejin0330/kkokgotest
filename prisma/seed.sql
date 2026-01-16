-- ============================================
-- 하이브리드 구조 Seed Data (초기 데이터)
-- Supabase SQL Editor에서 실행하세요
-- 마이그레이션 완료 후 사용
-- ============================================

-- ============================================
-- 1. Traits 테이블 INSERT (11개 특성)
-- ============================================

-- INTEREST (흥미) - 4개
INSERT INTO traits (name, type, created_at, updated_at) VALUES
  ('실무지향', 'INTEREST', NOW(), NOW()),
  ('기계조작', 'INTEREST', NOW(), NOW()),
  ('수리흥미', 'INTEREST', NOW(), NOW()),
  ('현장적응', 'INTEREST', NOW(), NOW())
ON CONFLICT (name, type) DO NOTHING;

-- APTITUDE (적성) - 7개
INSERT INTO traits (name, type, created_at, updated_at) VALUES
  ('언어이해', 'APTITUDE', NOW(), NOW()),
  ('수리력', 'APTITUDE', NOW(), NOW()),
  ('공간지각', 'APTITUDE', NOW(), NOW()),
  ('문제해결', 'APTITUDE', NOW(), NOW()),
  ('창의력', 'APTITUDE', NOW(), NOW()),
  ('집중력', 'APTITUDE', NOW(), NOW()),
  ('관찰탐구', 'APTITUDE', NOW(), NOW())
ON CONFLICT (name, type) DO NOTHING;

-- ============================================
-- 2. Majors 테이블 INSERT (학과 유형)
-- ============================================

INSERT INTO majors (name, category, description, created_at, updated_at) VALUES
  ('전기과', '전기전자', '전기 설비 설계, 시공, 유지보수 기술 학습', NOW(), NOW()),
  ('전자과', '전기전자', '전자회로 설계 및 제작 기술 학습', NOW(), NOW()),
  ('기계과', '기계', '기계 설계, 제작, 정비 기술 학습', NOW(), NOW()),
  ('자동화과', '기계', '산업 자동화 시스템 설계 및 운영 학습', NOW(), NOW()),
  ('자동화설비과', '기계', '자동화 설비 설치 및 유지보수 학습', NOW(), NOW()),
  ('스마트전자과', '전기전자', '스마트 전자기기 개발 및 IoT 기술 학습', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. Schools 테이블 INSERT (테스트 학교)
-- ============================================

INSERT INTO schools (name, admin_code, school_type, foundation_type, designation_th, region, created_at, updated_at) VALUES
  ('수도전기공업고등학교', 'TEST001', 'MEISTER', '공립', '1차', '서울', NOW(), NOW()),
  ('평택기계공업고등학교', 'TEST002', 'MEISTER', '공립', '2차', '경기', NOW(), NOW()),
  ('광주자동화설비공업고등학교', 'TEST003', 'MEISTER', '공립', '1차', '광주', NOW(), NOW())
ON CONFLICT (admin_code) DO NOTHING;

-- ============================================
-- 4. School_departments 테이블 INSERT (학교-학과 연결)
-- ============================================

-- 수도전기공업고등학교 학과
INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 40, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST001' AND m.name = '전기과'
ON CONFLICT (school_id, major_id) DO NOTHING;

INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 35, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST001' AND m.name = '전자과'
ON CONFLICT (school_id, major_id) DO NOTHING;

-- 평택기계공업고등학교 학과
INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 40, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST002' AND m.name = '기계과'
ON CONFLICT (school_id, major_id) DO NOTHING;

INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 35, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST002' AND m.name = '자동화과'
ON CONFLICT (school_id, major_id) DO NOTHING;

-- 광주자동화설비공업고등학교 학과
INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 40, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST003' AND m.name = '자동화설비과'
ON CONFLICT (school_id, major_id) DO NOTHING;

INSERT INTO school_departments (school_id, major_id, custom_name, quota, created_at, updated_at)
SELECT s.id, m.id, NULL, 35, NOW(), NOW()
FROM schools s, majors m
WHERE s.admin_code = 'TEST003' AND m.name = '스마트전자과'
ON CONFLICT (school_id, major_id) DO NOTHING;

-- ============================================
-- 5. Major_traits INSERT (학과별 적성 가중치)
-- ============================================

-- 전기과 적성
INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전기과' AND t.name = '수리력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전기과' AND t.name = '공간지각' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전기과' AND t.name = '문제해결' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 3, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전기과' AND t.name = '언어이해' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- 기계과 적성
INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '기계과' AND t.name = '공간지각' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '기계과' AND t.name = '수리력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '기계과' AND t.name = '집중력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- 전자과 적성
INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전자과' AND t.name = '수리력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전자과' AND t.name = '공간지각' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '전자과' AND t.name = '문제해결' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- 자동화과 적성
INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '자동화과' AND t.name = '공간지각' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '자동화과' AND t.name = '수리력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 4, NOW(), NOW()
FROM majors m, traits t
WHERE m.name = '자동화과' AND t.name = '창의력' AND t.type = 'APTITUDE'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- 흥미 특성 추가 (기계조작, 수리흥미)
INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name IN ('전기과', '전자과') AND t.name = '수리흥미' AND t.type = 'INTEREST'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO major_traits (major_id, trait_id, weight, created_at, updated_at)
SELECT m.id, t.id, 5, NOW(), NOW()
FROM majors m, traits t
WHERE m.name IN ('기계과', '자동화과') AND t.name = '기계조작' AND t.type = 'INTEREST'
ON CONFLICT (major_id, trait_id) DO UPDATE SET weight = EXCLUDED.weight;

-- ============================================
-- 완료! 데이터 확인 쿼리
-- ============================================

-- 학과 유형 확인
-- SELECT * FROM majors ORDER BY category, name;

-- 학교-학과 연결 확인
-- SELECT s.name as school, m.name as major, sd.custom_name, sd.quota
-- FROM school_departments sd
-- JOIN schools s ON sd.school_id = s.id
-- JOIN majors m ON sd.major_id = m.id
-- ORDER BY s.name, m.name;

-- 학과별 적성 확인
-- SELECT m.name as major, t.name as trait, t.type, mt.weight
-- FROM major_traits mt
-- JOIN majors m ON mt.major_id = m.id
-- JOIN traits t ON mt.trait_id = t.id
-- ORDER BY m.name, mt.weight DESC;
