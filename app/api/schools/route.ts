import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SchoolData {
  schoolName: string;
  majorName: string;
  region: string;
  address: string;
  schoolType: string;
}

interface EmploymentStats {
  schoolName: string;
  majorName: string;
  region: string;
  schoolType: string;
  graduates: number;
  employmentRate: number;
  enrollmentRate: number;
  surveyYear: string;
}

// CSV 파싱 함수 (기존 master DB용)
function parseCSV(content: string): SchoolData[] {
  const lines = content.split("\n");
  const headers = lines[0].split(",");
  
  // 필요한 컬럼 인덱스 찾기
  const schoolNameIdx = headers.findIndex(h => h.includes("학교명"));
  const majorNameIdx = headers.findIndex(h => h.includes("학과명"));
  const regionIdx = headers.findIndex(h => h.includes("시도명"));
  const addressIdx = headers.findIndex(h => h.includes("도로명주소"));
  const schoolTypeIdx = headers.findIndex(h => h.includes("고등학교구분명"));
  
  const schools: SchoolData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // CSV 파싱 (쉼표 처리)
    const values = parseCSVLine(line);
    
    const schoolName = values[schoolNameIdx] || "";
    const majorName = values[majorNameIdx] || "";
    const region = values[regionIdx] || "";
    const address = values[addressIdx] || "";
    const schoolType = values[schoolTypeIdx] || "";
    
    // 특성화고/마이스터고만 필터링
    if (schoolType === "특성화고" || schoolType === "마이스터고") {
      schools.push({
        schoolName,
        majorName,
        region,
        address,
        schoolType,
      });
    }
  }
  
  return schools;
}

// CSV 라인 파싱 (따옴표 처리)
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// 취업률/진학률 CSV 파싱
function parseEmploymentStats(content: string): EmploymentStats[] {
  const lines = content.split("\n");
  const stats: EmploymentStats[] = [];
  
  // 헤더: 학교명,학과명,시도,고교유형,졸업자수,취업률,진학률,조사연도
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    if (values.length < 8) continue;
    
    stats.push({
      schoolName: values[0],
      majorName: values[1],
      region: values[2],
      schoolType: values[3],
      graduates: parseInt(values[4]) || 0,
      employmentRate: parseFloat(values[5]) || 0,
      enrollmentRate: parseFloat(values[6]) || 0,
      surveyYear: values[7],
    });
  }
  
  return stats;
}

// 지역명 정규화 (IP API 응답과 CSV 매칭)
function normalizeRegion(region: string): string {
  const mapping: Record<string, string> = {
    "Seoul": "서울특별시",
    "Busan": "부산광역시",
    "Daegu": "대구광역시",
    "Incheon": "인천광역시",
    "Gwangju": "광주광역시",
    "Daejeon": "대전광역시",
    "Ulsan": "울산광역시",
    "Sejong": "세종특별자치시",
    "Gyeonggi-do": "경기도",
    "Gangwon-do": "강원특별자치도",
    "Chungcheongbuk-do": "충청북도",
    "Chungcheongnam-do": "충청남도",
    "Jeollabuk-do": "전북특별자치도",
    "Jeollanam-do": "전라남도",
    "Gyeongsangbuk-do": "경상북도",
    "Gyeongsangnam-do": "경상남도",
    "Jeju-do": "제주특별자치도",
  };
  
  return mapping[region] || region;
}

// 학과명 매칭 (부분 일치)
function matchMajor(searchMajor: string, dbMajor: string): boolean {
  // 이모지 및 특수문자 제거 강화
  const cleanSearch = searchMajor
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // 이모지 제거
    .replace(/[^\w가-힣]/g, "")
    .replace(/과$/, "")
    .toLowerCase()
    .trim();
    
  const cleanDb = dbMajor
    .replace(/[^\w가-힣]/g, "")
    .replace(/과$/, "")
    .toLowerCase()
    .trim();
  
  // 완전 일치
  if (cleanSearch === cleanDb) return true;
  
  // 부분 일치
  if (cleanDb.includes(cleanSearch) || cleanSearch.includes(cleanDb)) return true;
  
  // 키워드 매칭
  const keywords = cleanSearch.split(/[^가-힣a-z0-9]/i).filter(k => k.length > 1);
  return keywords.some(keyword => cleanDb.includes(keyword));
}

// 학과 특성에 따른 정렬 기준 결정
function getSortCriteria(major: string): "employment" | "enrollment" | "combined" {
  const majorLower = major.toLowerCase();
  
  // 예술/디자인 계열 → 진학률 우선
  if (
    majorLower.includes("웹툰") ||
    majorLower.includes("애니메이션") ||
    majorLower.includes("디자인") ||
    majorLower.includes("콘텐츠") ||
    majorLower.includes("게임") ||
    majorLower.includes("영상") ||
    majorLower.includes("방송")
  ) {
    return "enrollment";
  }
  
  // 공업/기계 계열 → 취업률 우선
  if (
    majorLower.includes("기계") ||
    majorLower.includes("전기") ||
    majorLower.includes("전자") ||
    majorLower.includes("로봇") ||
    majorLower.includes("드론") ||
    majorLower.includes("항공") ||
    majorLower.includes("조선") ||
    majorLower.includes("건축") ||
    majorLower.includes("토목")
  ) {
    return "employment";
  }
  
  // 기타 → 합산 점수
  return "combined";
}

// 학교 정렬 함수
function sortSchools(
  schools: (SchoolResult & { major: string })[],
  criteria: "employment" | "enrollment" | "combined"
): (SchoolResult & { major: string })[] {
  return [...schools].sort((a, b) => {
    if (criteria === "employment") {
      const aRate = a.employmentRate ?? 0;
      const bRate = b.employmentRate ?? 0;
      return bRate - aRate;
    } else if (criteria === "enrollment") {
      const aRate = a.enrollmentRate ?? 0;
      const bRate = b.enrollmentRate ?? 0;
      return bRate - aRate;
    } else {
      // combined: 취업률 + 진학률 합산
      const aTotal = (a.employmentRate ?? 0) + (a.enrollmentRate ?? 0);
      const bTotal = (b.employmentRate ?? 0) + (b.enrollmentRate ?? 0);
      return bTotal - aTotal;
    }
  });
}

export interface SchoolResult {
  schoolName: string;
  address: string;
  employmentRate: number | null;
  enrollmentRate: number | null;
  graduates: number | null;
  surveyYear: string | null;
  schoolType: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const majors = searchParams.get("majors")?.split(",") || [];
  const region = searchParams.get("region") || "서울특별시";
  
  try {
    // 기존 master DB 읽기
    const csvPath = path.join(process.cwd(), "app/data/kkokgo_master_db.csv");
    const content = fs.readFileSync(csvPath, "utf-8");
    const schools = parseCSV(content);
    
    // 취업률/진학률 데이터 읽기
    const statsPath = path.join(process.cwd(), "app/data/school_employment_stats.csv");
    let employmentStats: EmploymentStats[] = [];
    
    if (fs.existsSync(statsPath)) {
      const statsContent = fs.readFileSync(statsPath, "utf-8");
      employmentStats = parseEmploymentStats(statsContent);
    }
    
    // 지역 정규화
    const normalizedRegion = normalizeRegion(region);
    const regionPrefix = normalizedRegion.slice(0, 2);
    
    // 학과별 학교 찾기 (여러 학교를 찾아서 정렬)
    const results: Record<string, SchoolResult[]> = {};
    
    for (const major of majors) {
      // 해당 학과와 매칭되는 모든 학교 찾기 (전국)
      let matchedStats = employmentStats.filter(s => matchMajor(major, s.majorName));
      
      // 매칭 실패 시 유사한 학과 찾기 (키워드 기반)
      if (matchedStats.length === 0) {
        const majorKeywords = major
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // 이모지 제거
          .replace(/[^\w가-힣]/g, "")
          .toLowerCase()
          .split(/\s+/)
          .filter(k => k.length > 1);
        
        matchedStats = employmentStats.filter(s => {
          const dbMajor = s.majorName.toLowerCase();
          return majorKeywords.some(keyword => dbMajor.includes(keyword));
        });
      }
      
      // 학교 정보 조합
      const schoolResults: (SchoolResult & { major: string })[] = matchedStats.map(stat => {
        // 주소 정보 보완을 위해 master DB에서 찾기
        const schoolMatch = schools.find(
          s => s.schoolName === stat.schoolName && matchMajor(major, s.majorName)
        );
        
        return {
          schoolName: stat.schoolName,
          address: schoolMatch?.address || stat.region || "",
          employmentRate: stat.employmentRate,
          enrollmentRate: stat.enrollmentRate,
          graduates: stat.graduates,
          surveyYear: stat.surveyYear,
          schoolType: stat.schoolType,
          major: major,
        };
      });
      
      // 학과 특성에 따라 정렬 기준 결정
      const sortCriteria = getSortCriteria(major);
      
      // 정렬 후 상위 5개만 선택
      const sortedSchools = sortSchools(schoolResults, sortCriteria).slice(0, 5);
      
      // major 필드 제거하고 반환
      results[major] = sortedSchools.map(({ major: _, ...rest }) => rest);
    }
    
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("School search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search schools" },
      { status: 500 }
    );
  }
}

// IP 기반 지역 조회 엔드포인트
export async function POST() {
  try {
    const res = await fetch("http://ip-api.com/json/?fields=regionName,city");
    const data = await res.json();
    
    return NextResponse.json({
      success: true,
      region: data.regionName || "Seoul",
      city: data.city || "",
    });
  } catch (error) {
    console.error("IP location error:", error);
    return NextResponse.json({
      success: true,
      region: "Seoul",
      city: "",
    });
  }
}
