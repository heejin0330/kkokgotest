import fs from 'fs';
import path from 'path';

// 병합된 마스터 데이터베이스 타입 정의
export interface SchoolMajorData {
  // 학과 정보 (all_major_info_merged.csv에서)
  시도교육청코드: string;
  시도교육청명: string;
  행정표준코드: string;
  학교명: string;
  주야과정명: string;
  계열명: string;
  학과명: string;
  수정일자: string;
  
  // 학교 상세 정보 (highschoolinfo.csv에서)
  영문학교명?: string;
  학교종류명?: string;
  시도명?: string;
  관할조직명?: string;
  설립명?: string;
  도로명우편번호?: string;
  도로명주소?: string;
  도로명상세주소?: string;
  전화번호?: string;
  홈페이지주소?: string;
  남녀공학구분명?: string;
  팩스번호?: string;
  고등학교구분명?: string;
  산업체특별학급존재여부?: string;
  고등학교일반전문구분명?: string;
  특수목적고등학교계열명?: string;
  입시전후기구분명?: string;
  주야구분명?: string;
  설립일자?: string;
  개교기념일?: string;
  수정일자_school?: string;
}

/**
 * CSV 파일을 파싱하여 객체 배열로 변환
 */
function parseCSV(csvContent: string): SchoolMajorData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // 헤더 추출
  const headers = lines[0].split(',').map(h => h.trim());
  
  // 데이터 행 파싱
  const data: SchoolMajorData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row as SchoolMajorData);
  }
  
  return data;
}

/**
 * CSV 라인을 파싱 (쉼표로 구분, 따옴표 처리)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

/**
 * 병합된 마스터 데이터베이스 CSV 파일을 로드
 * @returns 학교 및 학과 정보 배열
 */
export async function loadSchoolMajorData(): Promise<SchoolMajorData[]> {
  try {
    const filePath = path.join(process.cwd(), 'app', 'data', 'kkokgo_master_db.csv');
    
    if (!fs.existsSync(filePath)) {
      console.warn(`파일을 찾을 수 없습니다: ${filePath}`);
      console.warn('Python 스크립트를 먼저 실행하여 데이터를 생성해주세요.');
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = parseCSV(fileContent);
    
    return data;
  } catch (error) {
    console.error('데이터 로드 중 오류 발생:', error);
    return [];
  }
}

/**
 * 특정 학교명으로 데이터 검색
 */
export function findSchoolByName(
  data: SchoolMajorData[],
  schoolName: string
): SchoolMajorData[] {
  return data.filter(
    item => item.학교명.includes(schoolName) || schoolName.includes(item.학교명)
  );
}

/**
 * 특정 학과명으로 데이터 검색
 */
export function findMajorByName(
  data: SchoolMajorData[],
  majorName: string
): SchoolMajorData[] {
  return data.filter(
    item => item.학과명.includes(majorName) || majorName.includes(item.학과명)
  );
}

/**
 * 특성화고/마이스터고만 필터링
 */
export function filterSpecializedSchools(
  data: SchoolMajorData[]
): SchoolMajorData[] {
  return data.filter(
    item => 
      item.고등학교구분명 === '특성화고' || 
      item.고등학교구분명 === '마이스터고' ||
      item.고등학교일반전문구분명 === '전문계'
  );
}

/**
 * 특정 시도로 필터링
 */
export function filterByRegion(
  data: SchoolMajorData[],
  sidoName: string
): SchoolMajorData[] {
  return data.filter(item => item.시도명 === sidoName);
}
