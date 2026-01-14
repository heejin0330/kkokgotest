const fs = require('fs');
const path = require('path');

// 1. 경로 설정
const dataDir = path.join('app', 'data');
const schoolFile = path.join(dataDir, 'highschoolinfo.csv');
const majorFile = path.join(dataDir, 'all_major_info_merged.csv');
const outputFile = path.join(dataDir, 'kkokgo_master_db.csv');

console.log('='.repeat(50));
console.log('데이터 병합 스크립트 시작');
console.log('='.repeat(50));
console.log(`현재 작업 디렉토리: ${process.cwd()}`);
console.log(`Node.js 버전: ${process.version}`);
console.log('='.repeat(50));

// 2. 파일 존재 확인
if (!fs.existsSync(schoolFile)) {
  console.error(`오류: 학교 정보 파일을 찾을 수 없습니다: ${schoolFile}`);
  process.exit(1);
}

if (!fs.existsSync(majorFile)) {
  console.error(`오류: 학과 정보 파일을 찾을 수 없습니다: ${majorFile}`);
  process.exit(1);
}

console.log(`✓ 학교 정보 파일: ${schoolFile}`);
console.log(`✓ 학과 정보 파일: ${majorFile}`);

// 3. CSV 파싱 함수
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

// CSV 라인 파싱 (쉼표로 구분, 따옴표 처리)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// BOM 제거 함수
function removeBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  }
  return content;
}

// 4. 파일 로드
console.log('\n파일 로드 중...');
let schoolData, majorData;

try {
  const schoolContentRaw = fs.readFileSync(schoolFile, 'utf-8');
  const schoolContent = removeBOM(schoolContentRaw);
  schoolData = parseCSV(schoolContent);
  console.log(`✓ 학교 정보: ${schoolData.rows.length}개 행`);
} catch (error) {
  console.error(`오류: 학교 정보 파일 로드 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

try {
  const majorContentRaw = fs.readFileSync(majorFile, 'utf-8');
  const majorContent = removeBOM(majorContentRaw);
  majorData = parseCSV(majorContent);
  console.log(`✓ 학과 정보: ${majorData.rows.length}개 행`);
} catch (error) {
  console.error(`오류: 학과 정보 파일 로드 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

// 5. 데이터 전처리
console.log('\n데이터 전처리 중...');

// 행정표준코드가 공백이거나 없는 행 제거
const filteredMajor = majorData.rows.filter(row => {
  const code = String(row['행정표준코드'] || '').trim();
  return code !== '' && code !== 'nan' && code !== 'undefined';
});

const filteredSchool = schoolData.rows.filter(row => {
  const code = String(row['행정표준코드'] || '').trim();
  return code !== '' && code !== 'nan' && code !== 'undefined';
});

console.log(`✓ 전처리 후 학과 정보: ${filteredMajor.length}개 행`);
console.log(`✓ 전처리 후 학교 정보: ${filteredSchool.length}개 행`);

// 6. 데이터 타입 통일 (매칭 정확도 확보)
filteredMajor.forEach(row => {
  row['행정표준코드'] = String(row['행정표준코드'] || '').trim();
  row['시도교육청코드'] = String(row['시도교육청코드'] || '').trim();
});

filteredSchool.forEach(row => {
  row['행정표준코드'] = String(row['행정표준코드'] || '').trim();
  row['시도교육청코드'] = String(row['시도교육청코드'] || '').trim();
});

// 7. 병합 전 데이터 확인
console.log('\n병합 전 데이터 확인...');
const majorSample = filteredMajor.slice(0, 5).map(r => r['행정표준코드']);
const schoolSample = filteredSchool.slice(0, 5).map(r => r['행정표준코드']);
console.log(`학과 데이터의 행정표준코드 샘플: ${JSON.stringify(majorSample)}`);
console.log(`학교 데이터의 행정표준코드 샘플: ${JSON.stringify(schoolSample)}`);

// 8. 병합 실행
console.log('\n데이터 병합 중...');

// 인덱스 생성 (빠른 조회를 위해)
const schoolIndex = new Map();
filteredSchool.forEach(school => {
  const key = `${school['행정표준코드']}_${school['시도교육청코드']}`;
  if (!schoolIndex.has(key)) {
    schoolIndex.set(key, []);
  }
  schoolIndex.get(key).push(school);
});

// 병합 수행
const mergedRows = [];
filteredMajor.forEach(major => {
  const key = `${major['행정표준코드']}_${major['시도교육청코드']}`;
  const matchingSchools = schoolIndex.get(key) || [];
  
  if (matchingSchools.length > 0) {
    // 여러 학교가 매칭될 수 있으므로 각각 병합
    matchingSchools.forEach(school => {
      const merged = { ...major, ...school };
      // 중복 컬럼 처리 (school 데이터가 우선)
      Object.keys(school).forEach(key => {
        if (major[key] && school[key] && major[key] !== school[key]) {
          merged[`${key}_school`] = school[key];
        }
      });
      mergedRows.push(merged);
    });
  }
});

if (mergedRows.length === 0) {
  console.error('경고: 병합 결과가 비어있습니다!');
  console.error('행정표준코드와 시도교육청코드가 일치하는 데이터가 없습니다.');
  console.log('\n디버깅 정보:');
  
  const majorCodes = new Set(filteredMajor.map(r => r['행정표준코드']));
  const schoolCodes = new Set(filteredSchool.map(r => r['행정표준코드']));
  const commonCodes = [...majorCodes].filter(c => schoolCodes.has(c));
  
  console.log(`- 학과 데이터의 고유한 행정표준코드 개수: ${majorCodes.size}`);
  console.log(`- 학교 데이터의 고유한 행정표준코드 개수: ${schoolCodes.size}`);
  console.log(`- 공통 행정표준코드 개수: ${commonCodes.length}`);
  process.exit(1);
}

console.log(`✓ 병합 완료: ${mergedRows.length}개 행`);

// 9. 결과 저장
console.log(`\n결과 저장 중: ${outputFile}`);

try {
  // 모든 컬럼 수집
  const allColumns = new Set();
  mergedRows.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
  });
  
  const columns = Array.from(allColumns);
  
  // CSV 헤더 생성
  const header = columns.join(',');
  
  // CSV 행 생성
  const csvRows = mergedRows.map(row => {
    return columns.map(col => {
      const value = String(row[col] || '');
      // 쉼표나 따옴표가 있으면 따옴표로 감싸기
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  const csvContent = [header, ...csvRows].join('\n');
  // BOM을 추가하여 엑셀에서 한글이 깨지지 않도록 함
  const BOM = '\ufeff';
  fs.writeFileSync(outputFile, BOM + csvContent, 'utf-8');
  
  console.log('✓ 저장 완료!');
} catch (error) {
  console.error(`오류: 파일 저장 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

// 10. 결과 요약
console.log('\n' + '='.repeat(50));
console.log('작업 결과');
console.log('='.repeat(50));
console.log(`생성 파일: ${outputFile}`);
console.log(`전체 행 개수: ${mergedRows.length.toLocaleString()}개`);

const allColumns = new Set();
mergedRows.forEach(row => {
  Object.keys(row).forEach(key => allColumns.add(key));
});
const columns = Array.from(allColumns);

console.log(`컬럼 개수: ${columns.length}개`);
console.log(`\n컬럼 목록:`);
columns.forEach((col, i) => {
  console.log(`  ${i + 1}. ${col}`);
});
console.log('='.repeat(50));
