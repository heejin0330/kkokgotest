const XLSX = require('xlsx');
const path = require('path');

// 엑셀 파일 경로
const excelPath = path.join(__dirname, '../app/data/주요-14 (유초)특성화고 마이스터고 학교별 학과별 학급수 학생수 졸업후상황(2011-2025)__251127KO.xlsx');

console.log('📊 엑셀 파일 분석 시작...\n');

try {
  const workbook = XLSX.readFile(excelPath);
  
  // "데이터" 시트 상세 분석
  const dataSheet = workbook.Sheets['데이터'];
  const data = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });
  
  // 행 11이 헤더
  const headers = data[11];
  console.log('=== 전체 컬럼 목록 (행 11) ===');
  console.log('총 컬럼 수:', headers.length);
  headers.forEach((h, i) => {
    console.log(`${i}: ${h}`);
  });
  
  // 취업/진학 관련 컬럼
  console.log('\n=== 취업/진학 관련 컬럼 ===');
  headers.forEach((h, i) => {
    if (typeof h === 'string' && (h.includes('취업') || h.includes('진학') || h.includes('졸업'))) {
      console.log(`${i}: ${h}`);
    }
  });
  
  // 샘플 데이터 (행 12)
  console.log('\n=== 샘플 데이터 (행 12) ===');
  const sample = data[12];
  headers.forEach((h, i) => {
    console.log(`${h}: ${sample[i]}`);
  });
  
  // 최근 데이터 (2024년 or 2025년) 찾기
  console.log('\n=== 최근 연도 데이터 확인 ===');
  for (let i = data.length - 10; i < data.length; i++) {
    if (data[i] && data[i][0]) {
      console.log(`행${i}: 조사기준일=${data[i][0]}, 학교명=${data[i][8]}`);
    }
  }
  
} catch (error) {
  console.error('오류 발생:', error.message);
}

