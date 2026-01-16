-- ============================================
-- Schema Update for TargetCompany + AdmissionRule
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1) AdmissionRule 컬럼 추가
ALTER TABLE "admission_rules"
  ADD COLUMN IF NOT EXISTS "aptitude_ratio" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "attendance_ratio" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- 2) TargetCompany 테이블 생성
CREATE TABLE IF NOT EXISTS "target_companies" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "industry_type" TEXT NOT NULL,
  "department_id" TEXT NOT NULL REFERENCES "departments"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) 인덱스 추가
CREATE INDEX IF NOT EXISTS "target_companies_department_id_idx"
  ON "target_companies" ("department_id");

CREATE INDEX IF NOT EXISTS "target_companies_name_idx"
  ON "target_companies" ("name");


