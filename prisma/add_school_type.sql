-- ============================================
-- 학교 유형(school_type) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. school_type 컬럼 추가
-- MEISTER: 마이스터고
-- SPECIALIZED: 특성화고
-- GENERAL: 일반고 (향후 확장용)
ALTER TABLE "schools" 
ADD COLUMN IF NOT EXISTS "school_type" TEXT DEFAULT 'SPECIALIZED';

-- 2. 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS "schools_school_type_idx" ON "schools"("school_type");

-- 3. 기존 마이스터고 데이터 업데이트 (학교명에 '마이스터'가 포함된 경우)
UPDATE "schools" 
SET "school_type" = 'MEISTER' 
WHERE "name" LIKE '%마이스터%';

-- 4. 확인 쿼리
-- SELECT school_type, COUNT(*) FROM "schools" GROUP BY school_type;

