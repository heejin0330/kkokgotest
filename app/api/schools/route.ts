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

// CSV 파싱 함수
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
  const search = searchMajor.replace(/과$/, "").toLowerCase();
  const db = dbMajor.replace(/과$/, "").toLowerCase();
  
  // 완전 일치
  if (search === db) return true;
  
  // 부분 일치
  if (db.includes(search) || search.includes(db)) return true;
  
  // 키워드 매칭
  const keywords = search.split(/[^가-힣a-z0-9]/i).filter(k => k.length > 1);
  return keywords.some(keyword => db.includes(keyword));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const majors = searchParams.get("majors")?.split(",") || [];
  const region = searchParams.get("region") || "서울특별시";
  
  try {
    // CSV 파일 읽기
    const csvPath = path.join(process.cwd(), "app/data/kkokgo_master_db.csv");
    const content = fs.readFileSync(csvPath, "utf-8");
    const schools = parseCSV(content);
    
    // 지역 정규화
    const normalizedRegion = normalizeRegion(region);
    
    // 학과별 학교 찾기
    const results: Record<string, { schoolName: string; address: string } | null> = {};
    
    for (const major of majors) {
      // 1. 해당 지역에서 학과 검색
      let found = schools.find(
        s => s.region.includes(normalizedRegion.slice(0, 2)) && matchMajor(major, s.majorName)
      );
      
      // 2. 못 찾으면 전국에서 검색
      if (!found) {
        found = schools.find(s => matchMajor(major, s.majorName));
      }
      
      // 3. 그래도 못 찾으면 해당 지역 특성화고 아무거나
      if (!found) {
        found = schools.find(s => s.region.includes(normalizedRegion.slice(0, 2)));
      }
      
      results[major] = found
        ? {
            schoolName: found.schoolName,
            address: found.region,
          }
        : null;
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
