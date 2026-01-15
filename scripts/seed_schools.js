/**
 * 통합 학교/학과 데이터 시딩 스크립트
 * 
 * 실행 방법:
 *   node scripts/seed_schools.js --type=MEISTER      # 마이스터고만
 *   node scripts/seed_schools.js --type=SPECIALIZED  # 특성화고만
 *   node scripts/seed_schools.js --type=ALL          # 전체
 * 
 * 필요 환경변수:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY (또는 SUPABASE_SERVICE_ROLE_KEY)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// dotenv 로드
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const typeArg = args.find(arg => arg.startsWith('--type='));
const SEED_TYPE = typeArg ? typeArg.split('=')[1].toUpperCase() : 'MEISTER';

console.log(`\n🎯 시딩 유형: ${SEED_TYPE}\n`);

// 유효한 타입 검증
if (!['MEISTER', 'SPECIALIZED', 'ALL'].includes(SEED_TYPE)) {
  console.error('❌ 유효하지 않은 타입입니다. MEISTER, SPECIALIZED, ALL 중 하나를 선택하세요.');
  process.exit(1);
}

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
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
 * 학교 유형에 따라 데이터 필터링
 */
function filterBySchoolType(data, seedType) {
  return data.filter(row => {
    const schoolType = row['고등학교구분명'] || row['학교구분'];
    
    if (seedType === 'MEISTER') {
      return schoolType === '마이스터고';
    } else if (seedType === 'SPECIALIZED') {
      return schoolType === '특성화고';
    } else if (seedType === 'ALL') {
      return schoolType === '마이스터고' || schoolType === '특성화고';
    }
    return false;
  });
}

/**
 * CSV 학교구분을 DB school_type으로 변환
 */
function getSchoolType(row) {
  const schoolType = row['고등학교구분명'] || row['학교구분'];
  if (schoolType === '마이스터고') return 'MEISTER';
  if (schoolType === '특성화고') return 'SPECIALIZED';
  return 'GENERAL';
}

/**
 * 학교 데이터 추출 (중복 제거)
 */
function extractSchools(filteredData) {
  const schoolMap = new Map();
  
  filteredData.forEach(row => {
    const schoolCode = row['행정표준코드'];
    if (!schoolCode || schoolMap.has(schoolCode)) return;
    
    schoolMap.set(schoolCode, {
      id: `school_${schoolCode}`,
      name: row['학교명'],
      school_type: getSchoolType(row),
      foundation_type: row['설립명'] || '미정',
      designation_th: '미정',
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
function extractDepartments(filteredData) {
  const deptMap = new Map();
  let deptCounter = 0;
  
  filteredData.forEach(row => {
    const schoolCode = row['행정표준코드'];
    const deptName = row['학과명'];
    
    if (!schoolCode || !deptName) return;
    
    // 공통과정, 일반학과 등은 제외
    if (deptName.includes('공통') || deptName === '일반학과') return;
    
    const key = `${schoolCode}_${deptName}`;
    if (deptMap.has(key)) return;
    
    deptCounter++;
    deptMap.set(key, {
      id: `dept_${schoolCode}_${deptCounter}`,
      name: deptName,
      description: row['NCS_매칭키워드'] || null,
      school_id: `school_${schoolCode}`,
    });
  });
  
  return Array.from(deptMap.values());
}

/**
 * 기존 데이터 정리
 */
async function cleanExistingData(schoolType) {
  console.log(`🧹 기존 ${schoolType} 데이터 정리 중...`);
  
  if (schoolType === 'ALL') {
    // 전체 삭제
    await supabase.from('department_traits').delete().like('department_id', 'dept_%');
    await supabase.from('target_companies').delete().like('department_id', 'dept_%');
    await supabase.from('admission_rules').delete().like('department_id', 'dept_%');
    await supabase.from('departments').delete().like('id', 'dept_%');
    await supabase.from('schools').delete().like('id', 'school_%');
  } else {
    // 특정 유형만 삭제
    const { data: schools } = await supabase
      .from('schools')
      .select('id')
      .eq('school_type', schoolType)
      .like('id', 'school_%');
    
    if (schools && schools.length > 0) {
      const schoolIds = schools.map(s => s.id);
      
      // 관련 학과 조회
      const { data: depts } = await supabase
        .from('departments')
        .select('id')
        .in('school_id', schoolIds);
      
      if (depts && depts.length > 0) {
        const deptIds = depts.map(d => d.id);
        await supabase.from('department_traits').delete().in('department_id', deptIds);
        await supabase.from('target_companies').delete().in('department_id', deptIds);
        await supabase.from('admission_rules').delete().in('department_id', deptIds);
        await supabase.from('departments').delete().in('id', deptIds);
      }
      
      await supabase.from('schools').delete().in('id', schoolIds);
    }
  }
  
  console.log('✅ 정리 완료');
}

/**
 * 학교 데이터 삽입
 */
async function insertSchools(schools) {
  console.log(`📚 ${schools.length}개 학교 데이터 삽입 중...`);
  
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('schools')
      .upsert(batch, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`❌ 학교 삽입 오류 (배치 ${Math.floor(i / batchSize) + 1}):`, error.message);
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
  
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < departments.length; i += batchSize) {
    const batch = departments.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('departments')
      .upsert(batch, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`❌ 학과 삽입 오류 (배치 ${Math.floor(i / batchSize) + 1}):`, error.message);
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
  console.log('🚀 학교 데이터 시딩 시작\n');
  
  // 1. CSV 파일 읽기
  console.log('📂 CSV 파일 읽는 중...');
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${CSV_PATH}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const allData = parseCSV(csvContent);
  console.log(`✅ 총 ${allData.length}개 행 로드됨`);
  
  // 2. 유형별 필터링
  const filteredData = filterBySchoolType(allData, SEED_TYPE);
  console.log(`✅ ${SEED_TYPE} 유형: ${filteredData.length}개 행 필터링됨`);
  
  if (filteredData.length === 0) {
    console.error('❌ 해당 유형의 데이터가 없습니다.');
    process.exit(1);
  }
  
  // 3. 학교/학과 데이터 추출
  const schools = extractSchools(filteredData);
  const departments = extractDepartments(filteredData);
  
  console.log(`\n📊 추출 결과:`);
  console.log(`   - 학교: ${schools.length}개`);
  console.log(`   - 학과: ${departments.length}개\n`);
  
  // 4. 기존 데이터 정리
  await cleanExistingData(SEED_TYPE);
  
  // 5. 데이터 삽입
  const schoolCount = await insertSchools(schools);
  const deptCount = await insertDepartments(departments);
  
  // 6. 결과 출력
  console.log('\n🎉 시딩 완료!');
  console.log(`   - 학교: ${schoolCount}개 삽입됨`);
  console.log(`   - 학과: ${deptCount}개 삽입됨`);
  
  // 7. 통계 출력
  const { data: stats } = await supabase
    .from('schools')
    .select('school_type')
    .like('id', 'school_%');
  
  if (stats) {
    const counts = stats.reduce((acc, s) => {
      acc[s.school_type] = (acc[s.school_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 현재 DB 통계:');
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}개 학교`);
    });
  }
}

// 스크립트 실행
main().catch(console.error);

