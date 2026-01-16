/**
 * 하이브리드 구조 시딩 스크립트 (Supabase JS Client 사용)
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

/**
 * Traits 기본 데이터 삽입/업데이트
 */
async function upsertTraits() {
  console.log('📊 Traits 데이터 업데이트 중...');
  
  const traits = [
    // APTITUDE (적성)
    { name: '수리력', type: 'APTITUDE' },
    { name: '공간지각', type: 'APTITUDE' },
    { name: '언어이해', type: 'APTITUDE' },
    { name: '문제해결', type: 'APTITUDE' },
    { name: '창의력', type: 'APTITUDE' },
    { name: '집중력', type: 'APTITUDE' },
    { name: '관찰탐구', type: 'APTITUDE' },
    // INTEREST (흥미)
    { name: '실무지향', type: 'INTEREST' },
    { name: '기계조작', type: 'INTEREST' },
    { name: '수리흥미', type: 'INTEREST' },
    { name: '현장적응', type: 'INTEREST' },
  ];

  for (const trait of traits) {
    const { data: existing } = await supabase
      .from('traits')
      .select('id')
      .eq('name', trait.name)
      .eq('type', trait.type)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('traits')
        .insert(trait);
      
      if (error) {
        console.log(`  ⚠️ "${trait.name}" 추가 실패:`, error.message);
      } else {
        console.log(`  ✅ "${trait.name}" 추가됨`);
      }
    } else {
      console.log(`  ✓ "${trait.name}" 이미 존재 (id: ${existing.id})`);
    }
  }
}

/**
 * Majors 기본 데이터 삽입/업데이트
 */
async function upsertMajors() {
  console.log('\n🎓 Majors 데이터 업데이트 중...');
  
  const majors = [
    { name: '전기과', category: '전기전자', description: '전기 설비 설계, 시공, 유지보수 기술 학습' },
    { name: '전자과', category: '전기전자', description: '전자회로 설계 및 제작 기술 학습' },
    { name: '기계과', category: '기계', description: '기계 설계, 제작, 정비 기술 학습' },
    { name: '자동화과', category: '기계', description: '산업 자동화 시스템 설계 및 운영 학습' },
    { name: '자동화설비과', category: '기계', description: '자동화 설비 설치 및 유지보수 학습' },
    { name: '스마트전자과', category: '전기전자', description: '스마트 전자기기 개발 및 IoT 기술 학습' },
  ];

  for (const major of majors) {
    const { data: existing } = await supabase
      .from('majors')
      .select('id')
      .eq('name', major.name)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('majors')
        .insert(major);
      
      if (error) {
        console.log(`  ⚠️ "${major.name}" 추가 실패:`, error.message);
      } else {
        console.log(`  ✅ "${major.name}" 추가됨`);
      }
    } else {
      console.log(`  ✓ "${major.name}" 이미 존재 (id: ${existing.id})`);
    }
  }
}

/**
 * Major_traits 기본 데이터 삽입
 */
async function upsertMajorTraits() {
  console.log('\n🔗 Major-Trait 연결 업데이트 중...');
  
  // 학과별 적성 매핑
  const majorTraitsMap = {
    '전기과': [
      { trait: '수리력', type: 'APTITUDE', weight: 5 },
      { trait: '공간지각', type: 'APTITUDE', weight: 4 },
      { trait: '문제해결', type: 'APTITUDE', weight: 4 },
      { trait: '수리흥미', type: 'INTEREST', weight: 5 },
    ],
    '전자과': [
      { trait: '수리력', type: 'APTITUDE', weight: 5 },
      { trait: '공간지각', type: 'APTITUDE', weight: 4 },
      { trait: '문제해결', type: 'APTITUDE', weight: 4 },
      { trait: '수리흥미', type: 'INTEREST', weight: 5 },
    ],
    '기계과': [
      { trait: '공간지각', type: 'APTITUDE', weight: 5 },
      { trait: '수리력', type: 'APTITUDE', weight: 5 },
      { trait: '집중력', type: 'APTITUDE', weight: 4 },
      { trait: '기계조작', type: 'INTEREST', weight: 5 },
    ],
    '자동화과': [
      { trait: '공간지각', type: 'APTITUDE', weight: 5 },
      { trait: '수리력', type: 'APTITUDE', weight: 4 },
      { trait: '창의력', type: 'APTITUDE', weight: 4 },
      { trait: '기계조작', type: 'INTEREST', weight: 5 },
    ],
  };

  // majors와 traits 조회
  const { data: majors } = await supabase.from('majors').select('id, name');
  const { data: traits } = await supabase.from('traits').select('id, name, type');

  if (!majors || !traits) {
    console.log('  ⚠️ majors 또는 traits 데이터를 가져올 수 없습니다.');
    return;
  }

  const majorIdMap = new Map(majors.map(m => [m.name, m.id]));
  const traitIdMap = new Map(traits.map(t => [`${t.name}_${t.type}`, t.id]));

  let insertedCount = 0;
  for (const [majorName, traitList] of Object.entries(majorTraitsMap)) {
    const majorId = majorIdMap.get(majorName);
    if (!majorId) continue;

    for (const item of traitList) {
      const traitId = traitIdMap.get(`${item.trait}_${item.type}`);
      if (!traitId) continue;

      const { error } = await supabase
        .from('major_traits')
        .upsert({
          major_id: majorId,
          trait_id: traitId,
          weight: item.weight,
        }, { onConflict: 'major_id,trait_id' });

      if (!error) insertedCount++;
    }
  }

  console.log(`  ✅ ${insertedCount}개 major-trait 연결 완료`);
}

/**
 * 학교 데이터 업데이트 (에너지마이스터고 예시)
 */
async function updateSchoolData() {
  console.log('\n🏫 학교 데이터 업데이트 중...');
  
  // 에너지마이스터고 찾기
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, admin_code')
    .ilike('name', '%에너지마이스터%');

  if (!schools || schools.length === 0) {
    console.log('  ⚠️ 에너지마이스터고를 찾지 못했습니다.');
    return;
  }

  const school = schools[0];
  console.log(`  ✅ ${school.name} 발견 (id: ${school.id})`);

  // 해당 학교의 school_departments 조회
  const { data: schoolDepts } = await supabase
    .from('school_departments')
    .select(`
      id, 
      custom_name,
      major:majors(id, name)
    `)
    .eq('school_id', school.id);

  if (!schoolDepts || schoolDepts.length === 0) {
    console.log('  ⚠️ 학교-학과 연결 데이터가 없습니다.');
    return;
  }

  console.log(`  📚 ${schoolDepts.length}개 학과 발견`);

  const year = new Date().getFullYear();

  for (const sd of schoolDepts) {
    // 기존 입시전형 삭제
    await supabase
      .from('admission_rules')
      .delete()
      .eq('school_department_id', sd.id);

    // 새 입시전형 추가
    const { error: ruleError } = await supabase
      .from('admission_rules')
      .insert([
        {
          school_department_id: sd.id,
          admission_type: 'GENERAL',
          year,
          gpa_ratio: 30,
          interview_ratio: 30,
          aptitude_ratio: 30,
          attendance_ratio: 10,
          description: '내신과 적성검사 중심',
        },
        {
          school_department_id: sd.id,
          admission_type: 'SPECIAL',
          year,
          gpa_ratio: 10,
          interview_ratio: 50,
          aptitude_ratio: 30,
          attendance_ratio: 10,
          description: '면접 비중 높음',
        },
      ]);

    if (ruleError) {
      console.log(`    ❌ ${sd.major?.name} 입시전형 추가 실패:`, ruleError.message);
    } else {
      console.log(`    ✅ ${sd.major?.name} 입시전형 추가됨`);
    }
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🔄 하이브리드 구조 시딩 시작\n');

  await upsertTraits();
  await upsertMajors();
  await upsertMajorTraits();
  await updateSchoolData();
  
  console.log('\n✨ 시딩 완료!');
}

main().catch(console.error);
