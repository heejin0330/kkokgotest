import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export interface SchoolResult {
  schoolName: string;
  address: string;
  employmentRate: number | null;
  enrollmentRate: number | null;
  graduates: number | null;
  surveyYear: string | null;
  schoolType: string | null;
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

// 취업률/진학률 CSV 파싱 (보조 데이터)
function parseEmploymentStats(content: string): EmploymentStats[] {
  const lines = content.split("\n");
  const stats: EmploymentStats[] = [];
  
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

// 지역명 정규화 (IP API 응답과 DB 매칭)
function normalizeRegion(region: string): string {
  const mapping: Record<string, string> = {
    "Seoul": "서울",
    "Busan": "부산",
    "Daegu": "대구",
    "Incheon": "인천",
    "Gwangju": "광주",
    "Daejeon": "대전",
    "Ulsan": "울산",
    "Sejong": "세종",
    "Gyeonggi-do": "경기",
    "Gangwon-do": "강원",
    "Chungcheongbuk-do": "충북",
    "Chungcheongnam-do": "충남",
    "Jeollabuk-do": "전북",
    "Jeollanam-do": "전남",
    "Gyeongsangbuk-do": "경북",
    "Gyeongsangnam-do": "경남",
    "Jeju-do": "제주",
  };
  
  return mapping[region] || region;
}

// 학과명 정규화 (이모지 제거)
function cleanMajorName(major: string): string {
  return major
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // 이모지 제거
    .replace(/[\u{2600}-\u{26FF}]/gu, "")   // 기타 심볼 이모지
    .replace(/[\u{2700}-\u{27BF}]/gu, "")   // Dingbats
    .replace(/[^\w가-힣\s]/g, "")           // 특수문자 제거 (공백 유지)
    .trim();
}

// 학과명에서 핵심 키워드 추출
function extractMajorKeyword(major: string): string {
  const cleaned = cleanMajorName(major).replace(/과$/, "").replace(/학$/, "");
  // 일반적인 접두사/접미사 제거
  return cleaned
    .replace(/^(스마트|글로벌|융합|창의|미래|첨단)/, "")
    .replace(/(시스템|공학|학과|전공)$/, "")
    .trim();
}

// 학과명 매칭 (부분 일치)
function matchMajorName(searchMajor: string, dbMajor: string): boolean {
  const cleanSearch = cleanMajorName(searchMajor).replace(/과$/, "").toLowerCase();
  const cleanDb = dbMajor.replace(/과$/, "").toLowerCase();
  
  if (cleanSearch === cleanDb) return true;
  if (cleanDb.includes(cleanSearch) || cleanSearch.includes(cleanDb)) return true;
  
  return false;
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
  
  return "combined";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const majors = searchParams.get("majors")?.split(",") || [];
  const region = searchParams.get("region") || "서울";
  
  // Supabase 연결 확인
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing");
    return NextResponse.json(
      { success: false, error: "Database configuration error" },
      { status: 500 }
    );
  }
  
  try {
    const results: Record<string, SchoolResult[]> = {};
    
    // 취업률 데이터 로드 (보조 데이터로 사용)
    let employmentStats: EmploymentStats[] = [];
    const statsPath = path.join(process.cwd(), "app/data/school_employment_stats.csv");
    if (fs.existsSync(statsPath)) {
      const statsContent = fs.readFileSync(statsPath, "utf-8");
      employmentStats = parseEmploymentStats(statsContent);
    }
    
    // 지역 정규화
    const normalizedRegion = normalizeRegion(region);
    
    for (const major of majors) {
      const cleanedMajor = cleanMajorName(major);
      const keyword = extractMajorKeyword(major);
      const searchTerms = [cleanedMajor, cleanedMajor.replace(/과$/, ""), keyword].filter(Boolean);
      
      console.log(`Searching for major: "${major}" -> cleaned: "${cleanedMajor}", keyword: "${keyword}"`);
      
      // 1. Supabase에서 학과 검색 (majors 테이블) - 여러 검색어로 시도
      let majorData: { id: number; name: string }[] = [];
      
      for (const term of searchTerms) {
        if (!term || term.length < 2) continue;
        
        const { data, error: majorError } = await supabase
          .from("majors")
          .select("id, name")
          .ilike("name", `%${term}%`)
          .limit(10);
        
        if (majorError) {
          console.error(`Major search error for "${term}":`, majorError.message);
          continue;
        }
        
        if (data && data.length > 0) {
          majorData = data;
          console.log(`Found majors for term "${term}":`, data.map(d => d.name));
          break;
        }
      }
      
      if (majorData.length === 0) {
        // 매칭되는 학과가 없으면 빈 배열
        console.log(`No major found for any term: ${searchTerms.join(", ")}`);
        results[major] = [];
        continue;
      }
      
      // 2. 해당 학과를 개설한 학교 목록 조회 (school_departments + schools JOIN)
      const majorIds = majorData.map(m => m.id);
      
      const { data: schoolDepts, error: schoolError } = await supabase
        .from("school_departments")
        .select(`
          id,
          custom_name,
          major:majors(id, name),
          school:schools(id, name, region, address, school_type)
        `)
        .in("major_id", majorIds);
      
      if (schoolError) {
        console.error(`School dept search error:`, schoolError.message);
      }
      
      if (!schoolDepts || schoolDepts.length === 0) {
        console.log(`No school_departments found for major IDs:`, majorIds);
        results[major] = [];
        continue;
      }
      
      console.log(`Found ${schoolDepts.length} school_departments for ${major}`);
      
      // 3. 학교 결과 조합
      const schoolResults: SchoolResult[] = schoolDepts.map(sd => {
        const school = sd.school as any;
        const majorInfo = sd.major as any;
        
        // 취업률 데이터 매칭 (CSV에서)
        const stats = employmentStats.find(s => 
          s.schoolName === school?.name && 
          matchMajorName(majorInfo?.name || "", s.majorName)
        );
        
        return {
          schoolName: school?.name || "",
          address: school?.address || school?.region || "",
          employmentRate: stats?.employmentRate ?? null,
          enrollmentRate: stats?.enrollmentRate ?? null,
          graduates: stats?.graduates ?? null,
          surveyYear: stats?.surveyYear ?? null,
          schoolType: school?.school_type === "MEISTER" ? "마이스터고" : 
                      school?.school_type === "SPECIALIZED" ? "특성화고" : 
                      school?.school_type || null,
        };
      });
      
      // 4. 정렬 (취업률/진학률 기준)
      const sortCriteria = getSortCriteria(major);
      
      const sortedSchools = [...schoolResults].sort((a, b) => {
        if (sortCriteria === "employment") {
          return (b.employmentRate ?? 0) - (a.employmentRate ?? 0);
        } else if (sortCriteria === "enrollment") {
          return (b.enrollmentRate ?? 0) - (a.enrollmentRate ?? 0);
        } else {
          const aTotal = (a.employmentRate ?? 0) + (a.enrollmentRate ?? 0);
          const bTotal = (b.employmentRate ?? 0) + (b.enrollmentRate ?? 0);
          return bTotal - aTotal;
        }
      });
      
      // 5. 지역 우선순위 적용 (같은 지역 학교 먼저)
      const regionPrefix = normalizedRegion.slice(0, 2);
      const prioritizedSchools = [
        ...sortedSchools.filter(s => s.address?.includes(regionPrefix)),
        ...sortedSchools.filter(s => !s.address?.includes(regionPrefix)),
      ];
      
      // 상위 5개만 반환
      results[major] = prioritizedSchools.slice(0, 5);
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
