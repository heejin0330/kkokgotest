const fs = require('fs');
const path = require('path');

// 마스터 파일 정리 스크립트
// 깨진 NCS 컬럼 제거 및 원본 복원

const masterFile = path.join('app', 'data', 'kkokgo_master_db.csv');
const backupFile = path.join('app', 'data', 'kkokgo_master_db_backup.csv');

console.log('='.repeat(50));
console.log('마스터 파일 정리 스크립트');
console.log('='.repeat(50));

// BOM 제거 함수
function removeBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  }
  return content;
}

// CSV 라인 파싱
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

// 파일 읽기
console.log(`\n마스터 파일 읽기: ${masterFile}`);
const content = removeBOM(fs.readFileSync(masterFile, 'utf-8'));
const lines = content.split('\n').filter(line => line.trim());

console.log(`전체 행 수: ${lines.length}`);

// 헤더 파싱
const headers = parseCSVLine(lines[0]);
console.log(`현재 컬럼 수: ${headers.length}`);
console.log(`헤더: ${headers.slice(0, 10).join(', ')}...`);

// NCS 컬럼 찾기
const ncsColumns = [
  'NCS_소분류직무코드',
  'NCS_대분류코드',
  'NCS_중분류직무코드',
  'NCS_소분류직무명',
  'NCS_대분류명',
  'NCS_중분류직무명',
  '학교구분'
];

const ncsColumnIndices = [];
headers.forEach((header, index) => {
  if (ncsColumns.includes(header)) {
    ncsColumnIndices.push(index);
  }
});

console.log(`\nNCS 컬럼 인덱스: ${ncsColumnIndices.join(', ')}`);

if (ncsColumnIndices.length === 0) {
  console.log('NCS 컬럼이 없습니다. 원본 상태입니다.');
  process.exit(0);
}

// 원본 컬럼만 유지 (NCS 컬럼 제거)
const originalHeaders = headers.filter((h, i) => !ncsColumnIndices.includes(i));
console.log(`\n정리 후 컬럼 수: ${originalHeaders.length}`);
console.log(`정리 후 헤더: ${originalHeaders.slice(0, 10).join(', ')}...`);

// 백업 생성
console.log(`\n백업 파일 생성: ${backupFile}`);
fs.writeFileSync(backupFile, content, 'utf-8');
console.log('✓ 백업 완료');

// 데이터 정리
console.log('\n데이터 정리 중...');
const cleanedLines = [originalHeaders.join(',')];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  const cleanedValues = values.filter((v, idx) => !ncsColumnIndices.includes(idx));
  
  // CSV 형식으로 변환
  const csvLine = cleanedValues.map(val => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(',');
  
  cleanedLines.push(csvLine);
}

// 저장
console.log(`\n정리된 파일 저장: ${masterFile}`);
fs.writeFileSync(masterFile, '\ufeff' + cleanedLines.join('\n'), 'utf-8');
console.log('✓ 저장 완료');

console.log('\n' + '='.repeat(50));
console.log('마스터 파일 정리 완료!');
console.log(`원본 컬럼 수: ${headers.length} → ${originalHeaders.length}`);
console.log('='.repeat(50));
