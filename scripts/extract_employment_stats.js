/**
 * 엑셀 파일에서 학교별/학과별 취업률, 진학률 추출
 * 출처: 한국교육개발원 교육통계서비스 (KEDI)
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 파일 경로
const excelPath = path.join(__dirname, '../app/data/주요-14 (유초)특성화고 마이스터고 학교별 학과별 학급수 학생수 졸업후상황(2011-2025)__251127KO.xlsx');
const outputPath = path.join(__dirname, '../app/data/school_employment_stats.csv');

console.log('📊 취업률/진학률 데이터 추출 시작...\n');

try {
  // 엑셀 파일 읽기
  const workbook = XLSX.readFile(excelPath);
  const dataSheet = workbook.Sheets['데이터'];
  const rawData = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });
  
  // 헤더는 행 11 (0-indexed)
  const headers = rawData[11];
  
  // 필요한 컬럼 인덱스
  const colIdx = {
    조사기준일: 0,
    시도: 1,
    고교유형: 5,
    학교명: 9,
    학과명: 18,
    졸업자_계: 35,
    취업자_계: 38,
    진학자_계: 41,
  };
  
  // 데이터 추출 (행 12부터)
  const schoolStats = new Map(); // 학교명_학과명 -> 데이터
  
  for (let i = 12; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 42) continue;
    
    const 조사기준일 = String(row[colIdx.조사기준일] || '');
    const 시도 = row[colIdx.시도] || '';
    const 고교유형 = row[colIdx.고교유형] || '';
    const 학교명 = row[colIdx.학교명] || '';
    const 학과명 = row[colIdx.학과명] || '';
    const 졸업자 = Number(row[colIdx.졸업자_계]) || 0;
    const 취업자 = Number(row[colIdx.취업자_계]) || 0;
    const 진학자 = Number(row[colIdx.진학자_계]) || 0;
    
    // 특성화고/마이스터고만 필터
    if (!고교유형.includes('특성화고') && !고교유형.includes('마이스터고')) continue;
    
    // 학교명이 숫자인 경우 (코드) 스킵
    if (!학교명 || /^\d+$/.test(String(학교명))) continue;
    
    // 최신 연도 데이터만 (2024년 또는 2025년)
    const year = 조사기준일.substring(0, 4);
    if (year !== '2024' && year !== '2025') continue;
    
    // 졸업자가 있는 데이터만
    if (졸업자 === 0) continue;
    
    const key = `${학교명}_${학과명}`;
    
    // 같은 학교/학과가 있으면 최신 데이터로 업데이트
    const existing = schoolStats.get(key);
    if (!existing || existing.year < year) {
      const 취업률 = ((취업자 / 졸업자) * 100).toFixed(1);
      const 진학률 = ((진학자 / 졸업자) * 100).toFixed(1);
      
      schoolStats.set(key, {
        학교명,
        학과명,
        시도,
        고교유형,
        졸업자수: 졸업자,
        취업률: parseFloat(취업률),
        진학률: parseFloat(진학률),
        조사연도: year,
        year,
      });
    }
  }
  
  // CSV로 변환
  const csvHeaders = '학교명,학과명,시도,고교유형,졸업자수,취업률,진학률,조사연도';
  const csvRows = Array.from(schoolStats.values()).map(row => 
    `"${row.학교명}","${row.학과명}","${row.시도}","${row.고교유형}",${row.졸업자수},${row.취업률},${row.진학률},${row.조사연도}`
  );
  
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  // 파일 저장
  fs.writeFileSync(outputPath, '\ufeff' + csvContent, 'utf-8'); // BOM 추가
  
  console.log(`✅ CSV 파일 생성 완료: ${outputPath}`);
  console.log(`📈 총 ${schoolStats.size}개 학교/학과 데이터 추출`);
  
  // 샘플 데이터 출력
  console.log('\n📋 샘플 데이터 (처음 5개):');
  const samples = Array.from(schoolStats.values()).slice(0, 5);
  samples.forEach((s, i) => {
    console.log(`${i + 1}. ${s.학교명} - ${s.학과명}: 취업률 ${s.취업률}%, 진학률 ${s.진학률}%`);
  });
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

