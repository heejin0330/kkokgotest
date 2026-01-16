-- ============================================
-- 하이브리드 구조 마이그레이션 검증 쿼리
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- ============================================
-- 1. 테이블 존재 여부 확인
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('schools', 'majors', 'school_departments', 'traits', 'major_traits', 'pre_orders', 'admission_rules', 'target_companies')
ORDER BY table_name;

-- 기존 테이블이 삭제되었는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('departments', 'department_traits');
-- 결과가 없어야 함!

-- ============================================
-- 2. 테이블 구조 확인
-- ============================================

-- Schools 테이블 구조
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'schools'
ORDER BY ordinal_position;

-- Majors 테이블 구조
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'majors'
ORDER BY ordinal_position;

-- School_departments 테이블 구조
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'school_departments'
ORDER BY ordinal_position;

-- ============================================
-- 3. PK 및 UNIQUE 제약조건 확인
-- ============================================

SELECT 
  tc.table_name, 
  kcu.column_name,
  tc.constraint_type,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
  AND tc.table_name IN ('schools', 'majors', 'school_departments', 'traits', 'major_traits', 'pre_orders')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 4. FK 제약조건 확인
-- ============================================

SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- ============================================
-- 5. 데이터 카운트 확인
-- ============================================

SELECT 'schools' as table_name, COUNT(*) as count FROM schools
UNION ALL SELECT 'majors', COUNT(*) FROM majors
UNION ALL SELECT 'school_departments', COUNT(*) FROM school_departments
UNION ALL SELECT 'traits', COUNT(*) FROM traits
UNION ALL SELECT 'major_traits', COUNT(*) FROM major_traits
UNION ALL SELECT 'pre_orders', COUNT(*) FROM pre_orders;

-- ============================================
-- 6. 데이터 샘플 확인
-- ============================================

-- Schools 샘플 (새 ID 형식 확인)
SELECT id, name, admin_code, school_type, region
FROM schools
ORDER BY id
LIMIT 10;

-- Majors 샘플 (중복 없는 학과 목록)
SELECT id, name, category, description
FROM majors
ORDER BY name
LIMIT 20;

-- School_departments 샘플 (학교-학과 매핑)
SELECT 
  sd.id,
  s.name as school_name,
  m.name as major_name,
  sd.custom_name,
  sd.quota
FROM school_departments sd
JOIN schools s ON sd.school_id = s.id
JOIN majors m ON sd.major_id = m.id
ORDER BY s.name, m.name
LIMIT 20;

-- Major_traits 샘플 (학과별 적성)
SELECT 
  m.name as major_name,
  t.name as trait_name,
  t.type,
  mt.weight
FROM major_traits mt
JOIN majors m ON mt.major_id = m.id
JOIN traits t ON mt.trait_id = t.id
ORDER BY m.name, mt.weight DESC
LIMIT 20;

-- ============================================
-- 7. 데이터 무결성 확인
-- ============================================

-- 고아 school_departments 확인 (존재하지 않는 학교/학과 참조)
SELECT sd.id, sd.school_id, sd.major_id
FROM school_departments sd
LEFT JOIN schools s ON sd.school_id = s.id
LEFT JOIN majors m ON sd.major_id = m.id
WHERE s.id IS NULL OR m.id IS NULL;
-- 결과가 없어야 함!

-- 고아 major_traits 확인
SELECT mt.id, mt.major_id, mt.trait_id
FROM major_traits mt
LEFT JOIN majors m ON mt.major_id = m.id
LEFT JOIN traits t ON mt.trait_id = t.id
WHERE m.id IS NULL OR t.id IS NULL;
-- 결과가 없어야 함!

-- ============================================
-- 8. 주요 쿼리 테스트
-- ============================================

-- 8.1 "전기과가 있는 학교 목록"
SELECT s.name as school, s.region, m.name as major, sd.custom_name
FROM school_departments sd
JOIN schools s ON sd.school_id = s.id
JOIN majors m ON sd.major_id = m.id
WHERE m.name LIKE '%전기%'
ORDER BY s.region, s.name
LIMIT 20;

-- 8.2 "A학교에 있는 학과 목록" (학교 이름으로 검색)
SELECT m.name as major, sd.custom_name, sd.quota
FROM school_departments sd
JOIN schools s ON sd.school_id = s.id
JOIN majors m ON sd.major_id = m.id
WHERE s.name LIKE '%수도전기%'  -- 학교 이름 변경
ORDER BY m.name;

-- 8.3 "수리력 적성이 중요한 학과 TOP 10"
SELECT m.name as major, mt.weight
FROM major_traits mt
JOIN majors m ON mt.major_id = m.id
JOIN traits t ON mt.trait_id = t.id
WHERE t.name = '수리력'
ORDER BY mt.weight DESC
LIMIT 10;

-- 8.4 "서울 지역 마이스터고 학과 목록"
SELECT s.name as school, m.name as major, sd.custom_name
FROM school_departments sd
JOIN schools s ON sd.school_id = s.id
JOIN majors m ON sd.major_id = m.id
WHERE s.region = '서울' AND s.school_type = 'MEISTER'
ORDER BY s.name, m.name;

-- ============================================
-- 9. 시퀀스 상태 확인
-- ============================================

SELECT 
  sequencename,
  last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- ============================================
-- 마이그레이션 성공 체크리스트
-- ============================================
-- [ ] schools.id가 bigint 타입인가?
-- [ ] schools.admin_code가 존재하고 UNIQUE인가?
-- [ ] majors 테이블이 존재하고 중복 없는 학과명인가?
-- [ ] school_departments가 schools와 majors를 참조하는가?
-- [ ] major_traits가 majors와 traits를 참조하는가?
-- [ ] 기존 departments, department_traits 테이블이 삭제되었는가?
-- [ ] pre_orders.id가 bigint PK인가?
-- [ ] 고아 데이터가 없는가?
-- [ ] 시퀀스가 올바르게 설정되었는가?

