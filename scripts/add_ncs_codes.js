const fs = require('fs');
const path = require('path');

// 1. 경로 설정
const dataDir = path.join('app', 'data');
const masterFile = path.join(dataDir, 'kkokgo_master_db.csv');
const ncsFile = path.join(dataDir, 'ncs.csv');
const mappingFile = path.join('scripts', 'ncs_mapping_tables.json');
const outputFile = path.join(dataDir, 'kkokgo_master_db.csv');

console.log('='.repeat(50));
console.log('NCS 코드 매핑 스크립트 v3.0');
console.log('복합 키워드 분리 + 유사 키워드 + 계열 폴백 매칭');
console.log('='.repeat(50));
console.log(`현재 작업 디렉토리: ${process.cwd()}`);
console.log('='.repeat(50));

// 2. 파일 존재 확인
if (!fs.existsSync(masterFile)) {
  console.error(`오류: 마스터 데이터 파일을 찾을 수 없습니다: ${masterFile}`);
  process.exit(1);
}

if (!fs.existsSync(ncsFile)) {
  console.error(`오류: NCS 데이터 파일을 찾을 수 없습니다: ${ncsFile}`);
  process.exit(1);
}

if (!fs.existsSync(mappingFile)) {
  console.error(`오류: 매핑 테이블 파일을 찾을 수 없습니다: ${mappingFile}`);
  process.exit(1);
}

// 3. 매핑 테이블 로드
const mappingTables = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
console.log('✓ 매핑 테이블 로드 완료');

// 4. BOM 제거 함수
function removeBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  }
  return content;
}

// 5. CSV 파싱 함수
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length - 5) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
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

// 6. 파일 로드
console.log('\n파일 로드 중...');

let masterData;
try {
  const masterContent = removeBOM(fs.readFileSync(masterFile, 'utf-8'));
  masterData = parseCSV(masterContent);
  console.log(`✓ 마스터 데이터: ${masterData.rows.length}개 행, ${masterData.headers.length}개 컬럼`);
} catch (error) {
  console.error(`오류: 마스터 데이터 파일 로드 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

let ncsData;
try {
  const ncsContent = removeBOM(fs.readFileSync(ncsFile, 'utf-8'));
  ncsData = parseCSV(ncsContent);
  console.log(`✓ NCS 데이터: ${ncsData.rows.length}개 행`);
  
  if (ncsData.rows.length > 0) {
    const firstRow = ncsData.rows[0];
    console.log(`  샘플 자격종목명: ${firstRow['자격종목명'] || '없음'}`);
  }
} catch (error) {
  console.error(`오류: NCS 데이터 파일 로드 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

// 7. NCS 데이터 인덱싱
console.log('\nNCS 데이터 인덱싱 중...');
const ncsIndex = new Map();

ncsData.rows.forEach(ncsRow => {
  const certName = ncsRow['자격종목명'] || '';
  const unitName = ncsRow['능력단위명'] || '';
  const unitCode = ncsRow['능력단위코드'] || '';
  const certCode = ncsRow['자격종목코드'] || '';
  
  if (!certName) return;
  
  if (!ncsIndex.has(certName)) {
    ncsIndex.set(certName, {
      자격종목코드: certCode,
      자격종목명: certName,
      능력단위목록: []
    });
  }
  
  ncsIndex.get(certName).능력단위목록.push({
    능력단위코드: unitCode,
    능력단위명: unitName
  });
});

console.log(`✓ 인덱싱 완료: ${ncsIndex.size}개 자격종목`);

// 8. 복합 키워드 분리 함수
function splitCompoundKeywords(majorName) {
  if (!majorName) return [];
  
  const keywords = [];
  let normalized = majorName
    .replace(/과$/, '')
    .replace(/학과$/, '')
    .replace(/전공$/, '')
    .replace(/계열$/, '')
    .trim();
  
  // 접두어 분리
  const prefixes = mappingTables['복합어_분리_규칙']?.접두어 || [];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      keywords.push(prefix);
      normalized = normalized.substring(prefix.length).trim();
      break;
    }
  }
  
  // 접미어 분리
  const suffixes = mappingTables['복합어_분리_규칙']?.접미어 || [];
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length) {
      normalized = normalized.substring(0, normalized.length - suffix.length).trim();
    }
  }
  
  // 한글 단어 분리 (2글자 이상)
  const koreanPattern = /[가-힣]{2,}/g;
  const koreanWords = normalized.match(koreanPattern) || [];
  keywords.push(...koreanWords);
  
  // 영어 단어 분리
  const englishPattern = /[A-Za-z]+/gi;
  const englishWords = normalized.match(englishPattern) || [];
  keywords.push(...englishWords.map(w => w.toUpperCase()));
  
  // 숫자 제거된 단어도 추가 (예: "3D" -> "D" 제거, 하지만 "3D" 자체는 유지)
  if (normalized.includes('3D')) {
    keywords.push('3D');
  }
  
  return [...new Set(keywords)];
}

// 9. 동의어 확장 함수
function expandSynonyms(keyword) {
  const synonymGroups = mappingTables['동의어_그룹'] || {};
  const expanded = [keyword];
  
  for (const [groupName, synonyms] of Object.entries(synonymGroups)) {
    const lowerKeyword = keyword.toLowerCase();
    const lowerSynonyms = synonyms.map(s => s.toLowerCase());
    
    if (lowerSynonyms.includes(lowerKeyword)) {
      // 해당 키워드가 이 동의어 그룹에 속함 - 모든 동의어 추가
      synonyms.forEach(syn => {
        if (!expanded.includes(syn)) {
          expanded.push(syn);
        }
      });
    }
  }
  
  return expanded;
}

// 10. 학과명에서 키워드 추출 (개선된 버전)
function extractMajorKeywords(majorName) {
  if (!majorName) return [];
  
  const keywords = new Set();
  const keywordMapping = mappingTables['학과명_키워드_자격종목_매핑'];
  
  // 1. 복합 키워드 분리
  const splitKeywords = splitCompoundKeywords(majorName);
  splitKeywords.forEach(k => keywords.add(k));
  
  // 2. 원본 학과명에서 매핑 테이블 키워드 찾기
  const normalizedMajor = majorName.toLowerCase();
  
  for (const keyword of Object.keys(keywordMapping)) {
    if (normalizedMajor.includes(keyword.toLowerCase())) {
      keywords.add(keyword);
    }
  }
  
  // 3. 분리된 키워드에서 매핑 테이블 키워드 찾기
  for (const splitK of splitKeywords) {
    for (const keyword of Object.keys(keywordMapping)) {
      if (splitK.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(splitK.toLowerCase())) {
        keywords.add(keyword);
      }
    }
  }
  
  return Array.from(keywords);
}

// 11. NCS 매칭 함수 (개선된 버전)
function findNCSMatch(majorName, gyeyeolName) {
  if (!majorName) return null;
  
  const keywordMapping = mappingTables['학과명_키워드_자격종목_매핑'];
  const priorityKeywords = mappingTables['우선순위_키워드'];
  const gyeyeolFallback = mappingTables['계열_기본_자격종목'];
  
  // 1. 키워드 추출
  const keywords = extractMajorKeywords(majorName);
  
  // 2. 우선순위 키워드 우선 정렬
  const sortedKeywords = keywords.sort((a, b) => {
    const aIdx = priorityKeywords.indexOf(a);
    const bIdx = priorityKeywords.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  // 3. 키워드 기반 매칭 시도
  for (const keyword of sortedKeywords) {
    const certNames = keywordMapping[keyword];
    if (!certNames || certNames.length === 0) continue;
    
    for (const certName of certNames) {
      if (ncsIndex.has(certName)) {
        const ncsInfo = ncsIndex.get(certName);
        return {
          자격종목코드: ncsInfo.자격종목코드,
          자격종목명: ncsInfo.자격종목명,
          능력단위코드: ncsInfo.능력단위목록[0]?.능력단위코드 || '',
          능력단위명: ncsInfo.능력단위목록[0]?.능력단위명 || '',
          매칭키워드: keyword,
          매칭방식: '키워드'
        };
      }
    }
    
    // 4. 동의어 확장 매칭
    const expandedKeywords = expandSynonyms(keyword);
    for (const expKeyword of expandedKeywords) {
      if (expKeyword === keyword) continue;
      
      const expCertNames = keywordMapping[expKeyword];
      if (!expCertNames || expCertNames.length === 0) continue;
      
      for (const certName of expCertNames) {
        if (ncsIndex.has(certName)) {
          const ncsInfo = ncsIndex.get(certName);
          return {
            자격종목코드: ncsInfo.자격종목코드,
            자격종목명: ncsInfo.자격종목명,
            능력단위코드: ncsInfo.능력단위목록[0]?.능력단위코드 || '',
            능력단위명: ncsInfo.능력단위목록[0]?.능력단위명 || '',
            매칭키워드: `${keyword}→${expKeyword}`,
            매칭방식: '동의어'
          };
        }
      }
    }
  }
  
  // 5. 계열 기반 폴백 매칭 (마지막 수단)
  if (gyeyeolName && gyeyeolFallback[gyeyeolName]) {
    const fallbackCert = gyeyeolFallback[gyeyeolName];
    if (ncsIndex.has(fallbackCert.name)) {
      const ncsInfo = ncsIndex.get(fallbackCert.name);
      return {
        자격종목코드: ncsInfo.자격종목코드,
        자격종목명: ncsInfo.자격종목명,
        능력단위코드: ncsInfo.능력단위목록[0]?.능력단위코드 || '',
        능력단위명: ncsInfo.능력단위목록[0]?.능력단위명 || '',
        매칭키워드: `계열:${gyeyeolName}`,
        매칭방식: '계열폴백'
      };
    }
  }
  
  return null;
}

// 12. 기존 NCS 컬럼 제거 (스크립트 재실행 시 중복 방지)
const ncsColumns = [
  'NCS_자격종목코드', 'NCS_자격종목명', 'NCS_능력단위코드',
  'NCS_능력단위명', 'NCS_매칭키워드', '학교구분'
];

// 헤더에서 기존 NCS 컬럼 제거
const originalHeaderCount = masterData.headers.length;
masterData.headers = masterData.headers.filter(h => !ncsColumns.includes(h));
console.log(`\n기존 NCS 컬럼 제거: ${originalHeaderCount - masterData.headers.length}개`);

// 데이터 행에서 기존 NCS 컬럼 제거
masterData.rows.forEach(row => {
  ncsColumns.forEach(col => {
    delete row[col];
  });
});

// 13. 데이터 처리
console.log('\n데이터 필터링 및 NCS 매핑 중...');

let processedCount = 0;
let matchedCount = 0;
let keywordMatchCount = 0;
let synonymMatchCount = 0;
let fallbackMatchCount = 0;
let unmatchedMajors = new Set();

masterData.rows.forEach(row => {
  const schoolType = row['고등학교구분명'] || '';
  const schoolName = row['학교명'] || '';
  const majorName = row['학과명'] || '';
  const gyeyeolName = row['계열명'] || '';
  
  // 특성화고 또는 마이스터고 필터링
  let isTarget = false;
  let schoolCategory = '';
  
  if (schoolType === '특성화고') {
    isTarget = true;
    schoolCategory = '특성화고';
  } else if (schoolType === '특목고' && schoolName.includes('마이스터')) {
    isTarget = true;
    schoolCategory = '마이스터고';
  } else if (schoolType === '마이스터고') {
    isTarget = true;
    schoolCategory = '마이스터고';
  }
  
  if (isTarget) {
    processedCount++;
    
    // NCS 매칭
    const ncsMatch = findNCSMatch(majorName, gyeyeolName);
    
    if (ncsMatch) {
      matchedCount++;
      
      // 매칭 방식별 카운트
      if (ncsMatch.매칭방식 === '키워드') keywordMatchCount++;
      else if (ncsMatch.매칭방식 === '동의어') synonymMatchCount++;
      else if (ncsMatch.매칭방식 === '계열폴백') fallbackMatchCount++;
      
      row['NCS_자격종목코드'] = ncsMatch.자격종목코드;
      row['NCS_자격종목명'] = ncsMatch.자격종목명;
      row['NCS_능력단위코드'] = ncsMatch.능력단위코드;
      row['NCS_능력단위명'] = ncsMatch.능력단위명;
      row['NCS_매칭키워드'] = ncsMatch.매칭키워드;
      row['학교구분'] = schoolCategory;
    } else {
      unmatchedMajors.add(majorName);
      row['NCS_자격종목코드'] = '';
      row['NCS_자격종목명'] = '';
      row['NCS_능력단위코드'] = '';
      row['NCS_능력단위명'] = '';
      row['NCS_매칭키워드'] = '';
      row['학교구분'] = schoolCategory;
    }
  } else {
    // 대상이 아닌 경우 빈 값으로 설정
    row['NCS_자격종목코드'] = '';
    row['NCS_자격종목명'] = '';
    row['NCS_능력단위코드'] = '';
    row['NCS_능력단위명'] = '';
    row['NCS_매칭키워드'] = '';
    row['학교구분'] = '';
  }
});

const matchRate = processedCount > 0 ? ((matchedCount / processedCount) * 100).toFixed(1) : 0;
console.log(`✓ 처리 완료: ${processedCount}개 학과`);
console.log(`✓ 매칭 성공: ${matchedCount}개 (${matchRate}%)`);
console.log(`  - 키워드 매칭: ${keywordMatchCount}개`);
console.log(`  - 동의어 매칭: ${synonymMatchCount}개`);
console.log(`  - 계열 폴백: ${fallbackMatchCount}개`);
console.log(`✓ 매칭 실패: ${processedCount - matchedCount}개`);

// 14. 결과 저장
console.log(`\n결과 저장 중: ${outputFile}`);

try {
  // 새로운 헤더 생성
  const newHeaders = [
    ...masterData.headers,
    'NCS_자격종목코드',
    'NCS_자격종목명',
    'NCS_능력단위코드',
    'NCS_능력단위명',
    'NCS_매칭키워드',
    '학교구분'
  ];
  
  // CSV 헤더 생성
  const header = newHeaders.join(',');
  
  // CSV 행 생성
  const csvRows = masterData.rows.map(row => {
    return newHeaders.map(col => {
      const value = String(row[col] || '');
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  const csvContent = [header, ...csvRows].join('\n');
  fs.writeFileSync(outputFile, '\ufeff' + csvContent, 'utf-8');
  
  console.log('✓ 저장 완료!');
} catch (error) {
  console.error(`오류: 파일 저장 실패`);
  console.error(`상세 오류: ${error.message}`);
  process.exit(1);
}

// 15. 결과 리포트
console.log('\n' + '='.repeat(50));
console.log('작업 결과');
console.log('='.repeat(50));
console.log(`처리된 학과 수: ${processedCount.toLocaleString()}개`);
console.log(`매칭 성공: ${matchedCount.toLocaleString()}개 (${matchRate}%)`);
console.log(`  - 키워드 매칭: ${keywordMatchCount.toLocaleString()}개`);
console.log(`  - 동의어 매칭: ${synonymMatchCount.toLocaleString()}개`);
console.log(`  - 계열 폴백: ${fallbackMatchCount.toLocaleString()}개`);
console.log(`매칭 실패: ${(processedCount - matchedCount).toLocaleString()}개`);

if (unmatchedMajors.size > 0) {
  console.log(`\n매칭되지 않은 학과 목록 (${unmatchedMajors.size}개):`);
  const unmatchedArray = Array.from(unmatchedMajors).sort();
  unmatchedArray.slice(0, 30).forEach(major => {
    console.log(`  - ${major}`);
  });
  if (unmatchedArray.length > 30) {
    console.log(`  ... 외 ${unmatchedArray.length - 30}개`);
  }
}

console.log('='.repeat(50));
