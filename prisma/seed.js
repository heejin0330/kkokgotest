/**
 * PDF 분석 데이터 시딩 스크립트 (Supabase JS Client 사용)
 * 
 * 실행: node prisma/seed.js
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function upsertTraits() {
  const traits = [
    { name: '수리력', type: 'APTITUDE' },
    { name: '공간지각력', type: 'APTITUDE' },
    { name: '언어이해', type: 'APTITUDE' },
    { name: '문제해결', type: 'APTITUDE' },
    { name: '기계조작', type: 'INTEREST' },
    { name: '현장적응', type: 'INTEREST' },
  ];

  for (const trait of traits) {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('traits')
      .select('id')
      .eq('name', trait.name)
      .eq('type', trait.type)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('traits')
        .insert({
          id: `trait_${trait.type.toLowerCase()}_${trait.name}`,
          name: trait.name,
          type: trait.type,
        });
      
      if (error) {
        console.log(`⚠️ Trait "${trait.name}" 추가 실패:`, error.message);
      } else {
        console.log(`✅ Trait "${trait.name}" 추가됨`);
      }
    } else {
      console.log(`✓ Trait "${trait.name}" 이미 존재`);
    }
  }
}

async function updateSudoSchoolData() {
  // 한국에너지마이스터고등학교 찾기 (마이스터고 중 하나)
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .ilike('name', '%에너지마이스터%');

  if (!schools || schools.length === 0) {
    console.log('⚠️ 수도전기공업고등학교를 찾지 못했습니다.');
    return;
  }

  const school = schools[0];
  console.log(`✅ ${school.name} 발견`);

  // 해당 학교의 학과 조회
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('school_id', school.id);

  if (!departments || departments.length === 0) {
    console.log('⚠️ 학과 데이터가 없습니다.');
    return;
  }

  console.log(`📚 ${departments.length}개 학과 업데이트 중...`);

  const year = new Date().getFullYear();

  for (const dept of departments) {
    // 기존 입시전형 삭제
    await supabase
      .from('admission_rules')
      .delete()
      .eq('department_id', dept.id);

    // 새 입시전형 추가
    const { error: ruleError } = await supabase
      .from('admission_rules')
      .insert([
        {
          department_id: dept.id,
          admission_type: 'GENERAL',
          year,
          gpa_ratio: 30,
          interview_ratio: 30,
          aptitude_ratio: 30,
          attendance_ratio: 10,
          written_ratio: null,
          description: '내신과 적성검사 중심 (PDF 분석 기반)',
        },
        {
          department_id: dept.id,
          admission_type: 'SPECIAL',
          year,
          gpa_ratio: 10,
          interview_ratio: 50,
          aptitude_ratio: 30,
          attendance_ratio: 10,
          written_ratio: null,
          description: '면접 비중 높음 (PDF 분석 기반)',
        },
      ]);

    if (ruleError) {
      console.log(`❌ ${dept.name} 입시전형 추가 실패:`, ruleError.message);
    }

    // 기존 목표기업 삭제
    await supabase
      .from('target_companies')
      .delete()
      .eq('department_id', dept.id);

    // 전기/에너지 관련 학과만 목표기업 추가
    if (dept.name.includes('전기') || dept.name.includes('에너지')) {
      const { error: companyError } = await supabase
        .from('target_companies')
        .insert([
          { department_id: dept.id, name: '한국전력공사', industry_type: '공기업' },
          { department_id: dept.id, name: '삼성전자', industry_type: '대기업(반도체)' },
          { department_id: dept.id, name: '한국수력원자력', industry_type: '공기업' },
        ]);

      if (companyError) {
        console.log(`❌ ${dept.name} 목표기업 추가 실패:`, companyError.message);
      } else {
        console.log(`✅ ${dept.name} 목표기업 추가됨`);
      }
    }
  }
}

async function main() {
  console.log('🔄 PDF 분석 데이터 업데이트 시작\n');

  await upsertTraits();
  console.log('');

  await updateSudoSchoolData();
  
  console.log('\n✨ 데이터 업데이트 완료!');
}

main().catch(console.error);

