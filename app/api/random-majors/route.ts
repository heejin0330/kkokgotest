import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 홀랜드 유형별 키워드 매핑
const HOLLAND_KEYWORDS: Record<string, string[]> = {
  R: [
    // 실재형 - 기계, 전기, 건설, 농업, 축산 등 실용적 기술
    "기계", "전기", "자동차", "용접", "건설", "건축", "토목",
    "농업", "축산", "말", "원예", "조경", "산림", "수산", "양식",
    "드론", "항공", "정비", "설비", "배관", "냉동", "공조",
    "금형", "주조", "단조", "판금", "도장", "철도", "선박",
    "중장비", "에너지", "신재생", "태양광", "풍력", "발전",
    "가구", "목공", "세라믹", "금속", "제철", "제강",
    "반려동물", "애완", "동물", "조련", "사육", "수의",
    "식품가공", "제빵", "제과", "바리스타", "조리", // 조리는 R/S 중복 가능
  ],
  I: [
    // 탐구형 - IT, 과학, 연구 분야
    "소프트웨어", "SW", "정보", "컴퓨터", "IT", "인공지능", "AI",
    "빅데이터", "데이터", "네트워크", "클라우드", "사이버", "보안",
    "전자", "반도체", "로봇", "자동화", "IoT", "사물인터넷",
    "바이오", "생명", "화학", "제약", "의료기기", "임상",
    "환경", "에너지", "신소재", "나노", "광학", "레이저",
    "전지", "배터리", "이차전지", "수소", "연료전지",
    "통신", "5G", "무선", "위성", "항공우주",
    "과학", "연구", "분석", "측정", "품질",
  ],
  A: [
    // 예술형 - 디자인, 미술, 음악, 영상 등 창작 분야
    "디자인", "미술", "예술", "만화", "웹툰", "애니메이션",
    "게임", "그래픽", "영상", "방송", "미디어", "콘텐츠",
    "음악", "실용음악", "공연", "연기", "뮤지컬", "무용",
    "사진", "촬영", "편집", "VFX", "CG", "3D", "모델링",
    "패션", "의상", "섬유", "주얼리", "악세서리",
    "뷰티", "헤어", "메이크업", "네일", "피부", "미용",
    "인테리어", "실내", "공간", "전시", "무대",
    "도예", "공예", "한지", "전통", "문화재",
    "광고", "브랜드", "시각", "UI", "UX", "웹",
  ],
  S: [
    // 사회형 - 의료, 복지, 교육, 서비스
    "간호", "보건", "의료", "치위생", "치기공", "안경", "광학",
    "응급", "구급", "구조", "소방", "재난", "안전",
    "복지", "사회", "상담", "심리", "재활", "작업치료", "물리치료",
    "유아", "보육", "아동", "청소년", "노인", "장애인",
    "관광", "호텔", "항공서비스", "승무원", "여행", "레저",
    "외식", "조리", "식음료", "카페", "소믈리에", "바텐더",
    "스포츠", "체육", "레크리에이션", "생활체육",
    "번역", "통역", "외국어", "일본어", "중국어",
  ],
  E: [
    // 진취형 - 경영, 창업, 마케팅, 리더십
    "경영", "창업", "스타트업", "CEO", "리더",
    "마케팅", "광고", "홍보", "PR", "브랜딩",
    "무역", "국제", "글로벌", "수출", "물류",
    "유통", "판매", "영업", "커머스", "이커머스", "라이브",
    "크리에이터", "인플루언서", "MCN", "유튜브", "SNS",
    "방송", "PD", "연출", "기획", "프로듀서",
    "부동산", "자산", "투자", "주식", "펀드",
    "보험", "손해사정", "언더라이터",
  ],
  C: [
    // 관습형 - 회계, 사무, 행정, 금융
    "회계", "세무", "재무", "경리", "부기",
    "사무", "비서", "행정", "총무", "인사",
    "금융", "은행", "증권", "보험", "신용",
    "법률", "법무", "특허", "지식재산",
    "공무원", "공공", "정부", "지방", "민원",
    "물류", "유통", "재고", "SCM", "구매",
    "품질", "검사", "인증", "표준", "규격",
    "문서", "기록", "자료", "도서", "사서",
  ],
};

// 이모지 매핑 (학과 키워드별)
const EMOJI_MAP: Record<string, string> = {
  // R형
  "기계": "⚙️", "전기": "⚡", "자동차": "🚗", "용접": "🔥", "건설": "🏗️",
  "농업": "🌾", "축산": "🐄", "말": "🐴", "원예": "🌷", "조경": "🌳",
  "드론": "🚁", "항공": "✈️", "정비": "🔧", "설비": "🔩", "배관": "🚰",
  "반려동물": "🐕", "동물": "🐾", "수산": "🐟", "조리": "👨‍🍳",
  "에너지": "🔋", "태양광": "☀️", "풍력": "💨", "철도": "🚂", "선박": "🚢",
  
  // I형
  "소프트웨어": "💻", "SW": "💻", "정보": "📱", "컴퓨터": "🖥️", "IT": "💻",
  "인공지능": "🧠", "AI": "🤖", "빅데이터": "📊", "데이터": "📈",
  "전자": "🔌", "반도체": "🔬", "로봇": "🤖", "바이오": "🧬",
  "화학": "🧪", "제약": "💊", "환경": "🌍", "통신": "📡",
  "전지": "🔋", "이차전지": "🔋", "보안": "🛡️", "네트워크": "🌐",
  
  // A형
  "디자인": "🎨", "미술": "🖼️", "만화": "📚", "웹툰": "✏️",
  "게임": "🎮", "그래픽": "🖌️", "영상": "🎬", "방송": "📺",
  "음악": "🎵", "공연": "🎭", "패션": "👗", "뷰티": "💄",
  "사진": "📷", "인테리어": "🏠", "애니메이션": "🎞️",
  
  // S형
  "간호": "💉", "보건": "🏥", "의료": "⚕️", "응급": "🚑",
  "복지": "🤝", "유아": "👶", "관광": "🗺️", "호텔": "🏨",
  "스포츠": "⚽", "외식": "🍽️", "승무원": "✈️",
  
  // E형
  "경영": "📈", "창업": "🚀", "마케팅": "📢", "무역": "🌍",
  "크리에이터": "📹", "방송": "🎙️", "유통": "📦",
  
  // C형
  "회계": "🧾", "세무": "📋", "사무": "📂", "금융": "💰",
  "행정": "🏛️", "물류": "📦", "법률": "⚖️",
};

// 학과명에서 이모지 결정
function getEmojiForMajor(majorName: string): string {
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (majorName.includes(keyword)) {
      return emoji;
    }
  }
  // 기본 이모지
  return "📚";
}

// 학과명이 특정 홀랜드 유형에 해당하는지 확인
function matchesHollandType(majorName: string, type: string): boolean {
  const keywords = HOLLAND_KEYWORDS[type] || [];
  return keywords.some(keyword => 
    majorName.toLowerCase().includes(keyword.toLowerCase())
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type")?.toUpperCase() || "R";
  const count = Math.min(parseInt(searchParams.get("count") || "5"), 10);
  
  // 유효한 홀랜드 유형인지 확인
  if (!["R", "I", "A", "S", "E", "C"].includes(type)) {
    return NextResponse.json(
      { success: false, error: "Invalid Holland type" },
      { status: 400 }
    );
  }
  
  try {
    // 해당 유형의 키워드로 학과 검색
    const keywords = HOLLAND_KEYWORDS[type];
    
    // 여러 키워드로 OR 검색 쿼리 생성
    const orConditions = keywords.map(k => `name.ilike.%${k}%`).join(",");
    
    const { data: majors, error } = await supabase
      .from("majors")
      .select("id, name")
      .or(orConditions)
      .limit(200); // 충분한 후보 확보
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    if (!majors || majors.length === 0) {
      return NextResponse.json({
        success: true,
        type,
        majors: [],
        message: "No majors found for this type"
      });
    }
    
    // 해당 유형에 더 잘 맞는 학과 필터링 (다른 유형에도 매칭되는 경우 제외)
    const filteredMajors = majors.filter(major => {
      // 현재 유형에 매칭되는지 확인
      if (!matchesHollandType(major.name, type)) return false;
      
      // 다른 유형에 더 강하게 매칭되면 제외 (중복 방지)
      const otherTypes = ["R", "I", "A", "S", "E", "C"].filter(t => t !== type);
      for (const otherType of otherTypes) {
        // 특정 키워드가 다른 유형에만 해당하는 경우 제외
        const otherKeywords = HOLLAND_KEYWORDS[otherType];
        const currentKeywords = HOLLAND_KEYWORDS[type];
        
        // 다른 유형의 키워드가 현재 유형 키워드보다 더 구체적으로 매칭되면 제외
        const otherMatch = otherKeywords.some(k => 
          major.name.includes(k) && !currentKeywords.includes(k)
        );
        
        if (otherMatch) {
          // 하지만 현재 유형 키워드도 포함하면 유지
          const currentMatch = currentKeywords.some(k => major.name.includes(k));
          if (!currentMatch) return false;
        }
      }
      
      return true;
    });
    
    // 랜덤 셔플
    const shuffled = [...filteredMajors].sort(() => Math.random() - 0.5);
    
    // 상위 N개 선택
    const selected = shuffled.slice(0, count);
    
    // 이모지 추가
    const result = selected.map(major => ({
      id: major.id,
      name: major.name,
      emoji: getEmojiForMajor(major.name),
      displayName: `${getEmojiForMajor(major.name)} ${major.name}`
    }));
    
    return NextResponse.json({
      success: true,
      type,
      majors: result,
      totalAvailable: filteredMajors.length
    });
    
  } catch (error) {
    console.error("Random majors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch random majors" },
      { status: 500 }
    );
  }
}

