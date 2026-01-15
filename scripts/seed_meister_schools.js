/**
 * 마이스터고 학교/학과 데이터 시딩 스크립트
 * 
 * 실행 방법:
 * node scripts/seed_meister_schools.js
 * 
 * 필요 환경변수:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (또는 SUPABASE_SERVICE_ROLE_KEY)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// dotenv 로드
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 파일 경로
const CSV_PATH = path.join(__dirname, '..', 'app', 'data', 'kkokgo_master_db.csv');

/**
 * CSV 파일을 파싱하여 객체 배열로 반환
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // CSV 파싱 (쉼표가 값 안에 있을 수 있으므로 주의)
    const values = parseCSVLine(line);
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

/**
 * CSV 라인을 파싱 (따옴표 안의 쉼표 처리)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

/**
 * 마이스터고 데이터 필터링
 */
function filterMeisterSchools(data) {
  return data.filter(row => 
    row['고등학교구분명'] === '마이스터고' || 
    row['학교구분'] === '마이스터고'
  );
}

/**
 * 학교 데이터 추출 (중복 제거)
 */
function extractSchools(meisterData) {
  const schoolMap = new Map();
  
  meisterData.forEach(row => {
    const schoolCode = row['행정표준코드'];
    if (!schoolCode || schoolMap.has(schoolCode)) return;
    
    schoolMap.set(schoolCode, {
      id: `school_${schoolCode}`,
      name: row['학교명'],
      foundation_type: row['설립명'] || '미정',
      designation_th: '미정', // CSV에 없으므로 기본값
      region: row['시도명'] || null,
      address: row['도로명주소'] || null,
      phone: row['전화번호'] || null,
      homepage: row['홈페이지주소'] || null,
    });
  });
  
  return Array.from(schoolMap.values());
}

/**
 * 학과 데이터 추출 (중복 제거)
 */
function extractDepartments(meisterData) {
  const deptSet = new Set();
  const departments = [];
  
  meisterData.forEach(row => {
    const schoolCode = row['행정표준코드'];
    const deptName = row['학과명'];
    
    if (!schoolCode || !deptName) return;
    
    // 공통과정, 일반학과 등은 제외
    if (deptName.includes('공통') || deptName === '일반학과') return;
    
    const key = `${schoolCode}_${deptName}`;
    if (deptSet.has(key)) return;
    deptSet.add(key);
    
    // 고유 ID 생성 (학교코드 + 학과명 해시)
    const deptId = `dept_${schoolCode}_${deptSet.size}`;
    departments.push({
      id: deptId,
      name: deptName,
      description: row['NCS_매칭키워드'] || null,
      school_id: `school_${schoolCode}`,
    });
  });
  
  return departments;
}

/**
 * 기존 시드 데이터 정리 (선택적)
 */
async function cleanExistingData() {
  console.log('🧹 기존 시드 데이터 정리 중...');
  
  // department_traits에서 school_ 또는 dept_로 시작하는 것들 삭제
  const { error: dtError } = await supabase
    .from('department_traits')
    .delete()
    .like('department_id', 'dept_%');
  
  if (dtError) {
    console.warn('⚠️ department_traits 정리 실패:', dtError.message);
  }
  
  // departments 삭제
  const { error: deptError } = await supabase
    .from('departments')
    .delete()
    .like('id', 'dept_%');
  
  if (deptError) {
    console.warn('⚠️ departments 정리 실패:', deptError.message);
  }
  
  // schools 삭제
  const { error: schoolError } = await supabase
    .from('schools')
    .delete()
    .like('id', 'school_%');
  
  if (schoolError) {
    console.warn('⚠️ schools 정리 실패:', schoolError.message);
  }
  
  console.log('✅ 정리 완료');
}

/**
 * 학교 데이터 삽입
 */
async function insertSchools(schools) {
  console.log(`📚 ${schools.length}개 학교 데이터 삽입 중...`);
  
  // 배치로 삽입 (50개씩)
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('schools')
      .upsert(batch, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`❌ 학교 삽입 오류 (배치 ${i / batchSize + 1}):`, error.message);
    } else {
      insertedCount += data?.length || 0;
    }
  }
  
  console.log(`✅ ${insertedCount}개 학교 삽입 완료`);
  return insertedCount;
}

/**
 * 학과 데이터 삽입
 */
async function insertDepartments(departments) {
  console.log(`🎓 ${departments.length}개 학과 데이터 삽입 중...`);
  
  // 배치로 삽입 (50개씩)
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < departments.length; i += batchSize) {
    const batch = departments.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('departments')
      .upsert(batch, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`❌ 학과 삽입 오류 (배치 ${i / batchSize + 1}):`, error.message);
    } else {
      insertedCount += data?.length || 0;
    }
  }
  
  console.log(`✅ ${insertedCount}개 학과 삽입 완료`);
  return insertedCount;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 마이스터고 데이터 시딩 시작\n');
  
  // 1. CSV 파일 읽기
  console.log('📂 CSV 파일 읽는 중...');
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${CSV_PATH}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const allData = parseCSV(csvContent);
  console.log(`✅ 총 ${allData.length}개 행 로드됨`);
  
  // 2. 마이스터고 필터링
  const meisterData = filterMeisterSchools(allData);
  console.log(`✅ 마이스터고 ${meisterData.length}개 행 필터링됨`);
  
  if (meisterData.length === 0) {
    console.error('❌ 마이스터고 데이터가 없습니다.');
    process.exit(1);
  }
  
  // 3. 학교/학과 데이터 추출
  const schools = extractSchools(meisterData);
  const departments = extractDepartments(meisterData);
  
  console.log(`\n📊 추출 결과:`);
  console.log(`   - 학교: ${schools.length}개`);
  console.log(`   - 학과: ${departments.length}개\n`);
  
  // 4. 기존 데이터 정리 (선택적)
  await cleanExistingData();
  
  // 5. 데이터 삽입
  const schoolCount = await insertSchools(schools);
  const deptCount = await insertDepartments(departments);
  
  // 6. 결과 출력
  console.log('\n🎉 시딩 완료!');
  console.log(`   - 학교: ${schoolCount}개 삽입됨`);
  console.log(`   - 학과: ${deptCount}개 삽입됨`);
  
  // 7. 샘플 데이터 확인
  console.log('\n📋 샘플 데이터 확인:');
  const { data: sampleSchools } = await supabase
    .from('schools')
    .select('name, region, foundation_type')
    .like('id', 'school_%')
    .limit(5);
  
  if (sampleSchools?.length) {
    console.log('   학교 샘플:');
    sampleSchools.forEach(s => {
      console.log(`   - ${s.name} (${s.region}, ${s.foundation_type})`);
    });
  }
  
  const { data: sampleDepts } = await supabase
    .from('departments')
    .select('name, description')
    .like('id', 'dept_%')
    .limit(5);
  
  if (sampleDepts?.length) {
    console.log('   학과 샘플:');
    sampleDepts.forEach(d => {
      console.log(`   - ${d.name} (${d.description || '설명 없음'})`);
    });
  }
}

// 스크립트 실행
main().catch(console.error);

