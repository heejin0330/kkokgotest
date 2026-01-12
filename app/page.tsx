"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Circle, X, Sparkles, TrendingUp, Phone, Share2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
// 팩맨 프로그레스 바 컴포넌트
const PacmanProgress = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  // 진행률 계산 (0% ~ 100%)
  const progress = (current / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8 px-2">
      <div className="relative h-8 flex items-center justify-between">
        {/* 1. 배경에 깔린 점들 (Dots) */}
        {/* 전체 문항 수만큼 점을 찍습니다 */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: total }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < current
                  ? "bg-transparent scale-0" // 먹은 건 투명하게 사라짐
                  : "bg-white/20 scale-100" // 안 먹은 건 반투명 흰색
              }`}
            />
          ))}
        </div>

        {/* 2. 점을 먹으러 가는 팩맨 (Character) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
          style={{
            left: `${progress}%`,
            marginLeft: "-12px", // 팩맨 크기 절반만큼 보정해서 중앙 정렬
          }}
        >
          {/* 팩맨 아이콘 (입 벌리고 닫는 애니메이션 효과) */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse"></div>
            {/* 입 모양 (CSS 클립패스로 구현) */}
            <div
              className="absolute inset-0 bg-yellow-400 rounded-full"
              style={{
                clipPath: "polygon(100% 0%, 100% 100%, 50% 50%, 0% 50%, 0% 0%)",
                transform: "rotate(-45deg)",
              }}
            ></div>
            {/* 눈 */}
            <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
        </div>
      </div>

      {/* 3. 텍스트 표시 (선택사항) */}
      <div className="text-right text-[10px] text-gray-500 mt-1 font-mono">
        STAGE {current} / {total}
      </div>
    </div>
  );
};
// page.tsx 상단 (컴포넌트 바깥)

const TYPE_DETAILS = {
  R: {
    // 현실형 (엔지니어/기계)
    title: "현실형 (Realistic)",
    desc: "손재주가 좋고 기계를 다루는 데 천부적인 재능이 있어요.",
    hiddenMajors: ["로봇제어과 🤖", "정밀기계과 ⚙️", "항공정비과 ✈️"],
    recommendSchool: "수도전기공업고등학교", // 에너지 분야 탑티어
    schoolStats: {
      employmentRate: "97.7%",
      keyCompanys: ["한국전력공사", "삼성전자", "현대자동차"],
      avgSalary: "초봉 4,000만원↑ (공기업 기준)",
    },
    manual:
      "이론 공부보다 실습이 훨씬 재밌죠? 마이스터고 가면 내신 5등급도 대기업 기술직으로 골인할 수 있습니다.",
  },
  I: {
    // 탐구형 (IT/해커)
    title: "탐구형 (Investigative)",
    desc: "원리를 파고드는 분석가! 남들이 못 보는 버그를 찾아냅니다.",
    hiddenMajors: ["소프트웨어개발과 💻", "정보보호과 🛡️", "인공지능과 🧠"],
    recommendSchool: "대덕소프트웨어마이스터고", // SW 탑티어
    schoolStats: {
      employmentRate: "92.1%",
      keyCompanys: ["토스(Toss)", "배달의민족", "금융감독원"],
      avgSalary: "개발자 초봉 5,000만원↑",
    },
    manual:
      "애매한 대학 컴공과보다 낫습니다. 졸업과 동시에 '네카라쿠배' 개발자로 취업하거나 SKY 대학으로 진학하는 케이스가 많아요.",
  },
  A: {
    // 예술형 (디자인/웹툰)
    title: "예술형 (Artistic)",
    desc: "상상력이 풍부하고 나만의 개성을 표현하는 크리에이터!",
    hiddenMajors: ["웹툰창작과 🎨", "시각디자인과 🖌️", "게임그래픽과 🎮"],
    recommendSchool: "한국애니메이션고등학교", // 예체능 탑티어
    schoolStats: {
      employmentRate: "진학률 85%↑", // 예술계는 진학률이 중요
      keyCompanys: ["네이버웹툰", "한예종/홍익대 진학", "게임사 아트팀"],
      avgSalary: "업계 탑티어 포트폴리오 완성",
    },
    manual:
      "입시 미술 하느라 돈 쓰는 대신, 학교에서 웹툰 그리고 게임 만들면서 바로 프로 데뷔 준비하세요.",
  },
  S: {
    // 사회형 (보건/서비스)
    title: "사회형 (Social)",
    desc: "사람을 돕고 가르치는 데서 보람을 느끼는 천사표 리더!",
    hiddenMajors: ["보건간호과 💉", "공공행정과 🏛️", "관광경영과 ✈️"],
    recommendSchool: "서울관광고등학교", // 서비스 탑티어
    schoolStats: {
      employmentRate: "공무원 합격 다수",
      keyCompanys: ["9급 공무원", "대학병원 간호조무사", "호텔리어"],
      avgSalary: "안정적인 공무원 연금 확보",
    },
    manual:
      "남들 공무원 시험 준비할 때, 특성화고 특채로 20살에 9급 공무원 되는 지름길이 있습니다.",
  },
  E: {
    // 진취형 (금융/CEO)
    title: "진취형 (Enterprising)",
    desc: "설득하고 리드하는 야망가! 돈의 흐름을 읽는 눈이 있습니다.",
    hiddenMajors: ["금융회계과 💰", "창업경영과 📈", "마케팅과 📢"],
    recommendSchool: "서울여자상업고등학교", // 금융권 탑티어
    schoolStats: {
      employmentRate: "100% (취업희망자)",
      keyCompanys: ["한국은행", "금융감독원", "시중 5대 은행"],
      avgSalary: "금융권 초봉 5,000만원↑",
    },
    manual:
      "인서울 상경계열 나와도 힘든 '금융권 A매치' 공기업 취업, 여기선 학교 추천으로 갑니다.",
  },
  C: {
    // 관습형 (사무/행정)
    title: "관습형 (Conventional)",
    desc: "꼼꼼함의 대명사! 계획대로 척척 처리하는 완벽주의자.",
    hiddenMajors: ["스마트물류과 📦", "공공사무행정과 📂", "세무회계과 🧾"],
    recommendSchool: "선린인터넷고등학교", // IT+경영 융합
    schoolStats: {
      employmentRate: "대입/취업 선택형",
      keyCompanys: ["공공기관 사무직", "대기업 재무팀", "세무공무원"],
      avgSalary: "안정성 끝판왕 직무",
    },
    manual:
      "숫자에 밝고 정리를 잘하나요? 기업의 안살림을 책임지는 핵심 인재로 모셔갑니다.",
  },
};

// ------------------------------------------------------------------
// [1] Supabase 클라이언트 설정
// ------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// [2] 데이터 및 상수 정의
// ------------------------------------------------------------------
const questionBank = [
  {
    id: "R_01",
    type: "R",
    text: "기술/실습 시간에 기계나 공구를 만지는 게 이론 수업보다 훨씬 재밌다.",
  },
  {
    id: "R_02",
    type: "R",
    text: "고장 난 학교 물건(의자, 사물함 등)을 선생님 도움 없이 직접 고쳐본 적이 있다.",
  },
  {
    id: "R_03",
    type: "R",
    text: "과학 실험 시간에 실험 도구를 직접 만지고 조작하는 게 제일 좋다.",
  },
  {
    id: "R_04",
    type: "R",
    text: "책상에 앉아 공부하는 것보다, 체육 시간이나 야외 활동이 훨씬 좋다.",
  },
  {
    id: "R_05",
    type: "R",
    text: "학교 축제 때 무대나 부스를 직접 조립하고 설치하는 역할을 맡고 싶다.",
  },
  {
    id: "R_06",
    type: "R",
    text: "로봇 동아리, 드론 동아리 같은 기계를 다루는 활동에 관심이 많다.",
  },
  {
    id: "R_07",
    type: "R",
    text: "미용이나 요리 실습처럼 손을 직접 쓰는 수업이 재밌고 잘한다는 말을 듣는다.",
  },
  {
    id: "R_08",
    type: "R",
    text: "복잡한 이론보다는 직접 만들어보고 결과를 확인하는 프로젝트 수업이 좋다.",
  },
  {
    id: "R_09",
    type: "R",
    text: "동아리 활동으로 운동부나 야외 활동 동아리를 선택하고 싶다.",
  },
  {
    id: "R_10",
    type: "R",
    text: "친구들이 '너 손재주 좋다' 또는 '이거 어떻게 만들었어?'라고 물어본 적이 많다.",
  },
  {
    id: "I_01",
    type: "I",
    text: "수업 시간에 선생님께 '왜 그런가요?'라는 질문을 자주 하는 편이다.",
  },
  {
    id: "I_02",
    type: "I",
    text: "수학 문제나 과학 퀴즈를 풀었을 때 정답을 맞히면 짜릿하다.",
  },
  {
    id: "I_03",
    type: "I",
    text: "정보/코딩 수업이 재밌고, 프로그래밍이나 AI 분야에 관심이 많다.",
  },
  {
    id: "I_04",
    type: "I",
    text: "친구들끼리 논쟁할 때, 감정보다는 논리적으로 누가 맞는지 따지는 편이다.",
  },
  {
    id: "I_05",
    type: "I",
    text: "과학 실험 수업에서 가설을 세우고 검증하는 과정이 제일 재밌다.",
  },
  {
    id: "I_06",
    type: "I",
    text: "시험 문제를 풀 때도 답을 찍기보다는 논리적으로 분석해서 푸는 편이다.",
  },
  {
    id: "I_07",
    type: "I",
    text: "친구들이 놓친 오타나 계산 실수를 잘 찾아내서 지적해 준다.",
  },
  {
    id: "I_08",
    type: "I",
    text: "우주, AI, 미래 기술 같은 주제의 다큐멘터리나 뉴스를 즐겨 본다.",
  },
  {
    id: "I_09",
    type: "I",
    text: "조별 과제할 때 데이터를 표나 그래프로 정리하는 역할을 잘한다.",
  },
  {
    id: "I_10",
    type: "I",
    text: "수업 시간에 멍 때리고 있어도 머릿속으로는 계속 뭔가 생각하고 있다.",
  },
  {
    id: "A_01",
    type: "A",
    text: "수업 중에 교과서나 공책 구석에 낙서하느라 시간 가는 줄 모른다.",
  },
  {
    id: "A_02",
    type: "A",
    text: "같은 교복을 입어도 나만의 스타일로 리폼하거나 액세서리를 달고 싶다.",
  },
  {
    id: "A_03",
    type: "A",
    text: "발표 자료(PPT)를 만들 때 내용보다 디자인부터 신경 써서 꾸민다.",
  },
  {
    id: "A_04",
    type: "A",
    text: "나만의 독특한 취향이 있고, 남들과 똑같은 건 싫다.",
  },
  {
    id: "A_05",
    type: "A",
    text: "미술 시간이나 창작 활동 시간이 제일 재밌고 몰입된다.",
  },
  {
    id: "A_06",
    type: "A",
    text: "국어 시간에 소설이나 시를 읽을 때 주인공 감정에 깊이 몰입한다.",
  },
  {
    id: "A_07",
    type: "A",
    text: "영상 편집, 웹툰 그리기, 디자인 같은 창작 동아리에 관심이 많다.",
  },
  {
    id: "A_08",
    type: "A",
    text: "틀에 박힌 문제집 풀이나 반복 숙제는 너무 지루하고 답답하다.",
  },
  {
    id: "A_09",
    type: "A",
    text: "친구들이나 선생님께 '너는 독특하다' 또는 '4차원이다'라는 말을 들어본 적이 있다.",
  },
  {
    id: "A_10",
    type: "A",
    text: "학교 축제 때 공연이나 전시 같은 창작 활동을 기획하고 싶다.",
  },
  {
    id: "S_01",
    type: "S",
    text: "반 친구가 힘들어 보이면 먼저 다가가서 무슨 일인지 물어보고 위로해 준다.",
  },
  {
    id: "S_02",
    type: "S",
    text: "조별 과제에서 나만 잘하는 것보다 팀 전체가 좋은 점수 받는 게 더 기쁘다.",
  },
  {
    id: "S_03",
    type: "S",
    text: "전학생이나 새로운 친구에게 먼저 말을 걸고 금방 친해지는 편이다.",
  },
  {
    id: "S_04",
    type: "S",
    text: "친구에게 공부를 가르쳐 주거나 설명해 줄 때 보람을 느낀다.",
  },
  {
    id: "S_05",
    type: "S",
    text: "친구들의 고민 상담을 자주 들어주고, '너랑 얘기하면 기분이 좋아진다'는 말을 듣는다.",
  },
  {
    id: "S_06",
    type: "S",
    text: "봉사 동아리나 또래 상담 같은 남을 돕는 활동에 관심이 많다.",
  },
  {
    id: "S_07",
    type: "S",
    text: "조별 과제나 학급 활동에서 분위기를 밝게 만드는 역할을 자주 한다.",
  },
  {
    id: "S_08",
    type: "S",
    text: "혼자 유튜브 보는 것보다 친구들과 직접 만나서 수다 떠는 게 훨씬 좋다.",
  },
  {
    id: "S_09",
    type: "S",
    text: "친구들이 나를 찾고 의지할 때 내가 필요한 사람이라고 느껴져서 행복하다.",
  },
  {
    id: "S_10",
    type: "S",
    text: "간호사, 상담사, 선생님처럼 사람을 돕는 직업이 멋있어 보인다.",
  },
  {
    id: "E_01",
    type: "E",
    text: "조별 과제나 동아리 활동에서 리더(조장)를 맡는 게 부담스럽지 않다.",
  },
  {
    id: "E_02",
    type: "E",
    text: "학급 회의에서 내 의견을 당당하게 말하고 친구들을 설득하는 편이다.",
  },
  {
    id: "E_03",
    type: "E",
    text: "나중에 창업을 하거나 사업가가 되어서 성공하고 싶다는 생각을 자주 한다.",
  },
  {
    id: "E_04",
    type: "E",
    text: "점심 메뉴나 여행지를 정할 때 친구들을 설득해서 내 의견을 관철시킨다.",
  },
  {
    id: "E_05",
    type: "E",
    text: "학급 임원 선거에 출마하거나 사람들 앞에서 발표하는 게 떨리지 않는다.",
  },
  {
    id: "E_06",
    type: "E",
    text: "체육 대회나 게임에서 지면 너무 분해서 다음엔 꼭 이기고 싶다.",
  },
  {
    id: "E_07",
    type: "E",
    text: "학교 축제나 행사를 기획하거나 MC를 보는 역할을 해보고 싶다.",
  },
  {
    id: "E_08",
    type: "E",
    text: "유행하는 물건이나 학교에서 핫한 정보를 남들보다 빨리 알아낸다.",
  },
  {
    id: "E_09",
    type: "E",
    text: "실패하더라도 도전해보는 게 아무것도 안 하는 것보다 낫다고 생각한다.",
  },
  {
    id: "E_10",
    type: "E",
    text: "중간/기말 시험 목표 점수를 정하고 계획을 세워서 공부한다.",
  },
  {
    id: "C_01",
    type: "C",
    text: "시험 공부할 때 책상이 지저분하면 집중이 안 돼서 정리부터 한다.",
  },
  {
    id: "C_02",
    type: "C",
    text: "시험 기간에 플래너로 과목별 공부 계획을 시간 단위로 짜는 편이다.",
  },
  {
    id: "C_03",
    type: "C",
    text: "용돈 기입장을 쓰거나 돈을 어디에 썼는지 정확하게 계산한다.",
  },
  {
    id: "C_04",
    type: "C",
    text: "갑자기 일정이 바뀌는 것보다 정해진 시간표대로 움직이는 게 편하다.",
  },
  {
    id: "C_05",
    type: "C",
    text: "수학 문제를 풀 때 답이 딱딱 맞아떨어지면 쾌감을 느낀다.",
  },
  {
    id: "C_06",
    type: "C",
    text: "준비물이나 시험 범위를 체크리스트로 만들어서 빠진 게 없는지 확인한다.",
  },
  {
    id: "C_07",
    type: "C",
    text: "약속 시간을 칼같이 지키고, 지각하는 친구를 보면 이해가 안 된다.",
  },
  {
    id: "C_08",
    type: "C",
    text: "화려한 것보다는 단정하고 깔끔한 교복 스타일을 선호한다.",
  },
  {
    id: "C_09",
    type: "C",
    text: "발표 자료를 만들 때 폰트, 줄 간격이 안 맞으면 거슬려서 수정한다.",
  },
  {
    id: "C_10",
    type: "C",
    text: "선생님들께 '성실하다', '책임감 있다'는 평가를 자주 받는다.",
  },
];

const resultMapping: any = {
  R: { title: "마이더스의 손", emoji: "🛠️", desc: "손만 대면 고쳐내는" },
  I: { title: "천재 해커", emoji: "💻", desc: "10시간 걸릴 일을 10분 컷!" },
  A: { title: "트렌드 세터", emoji: "🎨", desc: "숨만 쉬어도 힙한" },
  S: { title: "핵인싸 아이돌", emoji: "💖", desc: "어딜 가나 사랑받는" },
  E: { title: "영앤리치 CEO", emoji: "👑", desc: "떡잎부터 남다른" },
  C: { title: "인간 AI", emoji: "🤖", desc: "실수란 없다, 걸어 다니는" },
};

const hollandTypes: any = {
  R: "실재형",
  I: "탐구형",
  A: "예술형",
  S: "사회형",
  E: "진취형",
  C: "관습형",
};

const recommendMajors: any = {
  R: [
    "🚁 드론공간정보과",
    "🐴 말산업육성과",
    "🏭 스마트팩토리과",
    "🔧 기계과",
    "⚡ 전기과",
  ],
  I: [
    "💾 AI해킹보안과",
    "🔋 이차전지과",
    "💊 바이오제약과",
    "💻 소프트웨어과",
    "🧪 화학공업과",
  ],
  A: [
    "🎤 K-POP콘텐츠과",
    "🎨 웹툰창작과",
    "💅 방송분장과",
    "🖌️ 시각디자인과",
    "🏠 실내건축과",
  ],
  S: [
    "🐶 반려동물케어과",
    "☕ 카페디저트과",
    "🚑 응급구조과",
    "💉 보건간호과",
    "👶 유아교육과",
  ],
  E: [
    "📹 1인크리에이터과",
    "🛍️ 라이브커머스과",
    "⛳ 레저골프경기과",
    "📈 금융경영과",
    "✈️ 관광경영과",
  ],
  C: [
    "📦 스마트물류과",
    "👮 공공행정과",
    "📊 금융빅데이터과",
    "💰 회계정보과",
    "🏢 세무행정과",
  ],
};

function getRandomMajors(type: string, count = 2) {
  const majors = [...recommendMajors[type]];
  const selected = [];
  for (let i = 0; i < count && majors.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * majors.length);
    selected.push(majors.splice(randomIndex, 1)[0]);
  }
  return selected;
}

const loadingMessages = [
  "🏫 전국 마이스터고/특성화고 커리큘럼 분석 중...",
  "💼 졸업생 실제 취업 데이터 대조 중...",
  "📊 나의 성향과 학과 적합도 매칭 중...",
];

// ------------------------------------------------------------------
// [3] Hook: 테스트 로직
// ------------------------------------------------------------------
function useTestLogic() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<any>({
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  });
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const types = ["R", "I", "A", "S", "E", "C"];
    const selected: any[] = [];
    types.forEach((type) => {
      const filtered = questionBank.filter((q) => q.type === type);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 2));
    });
    setQuestions(selected.sort(() => Math.random() - 0.5));
  }, []);

  const handleSwipe = (direction: string, questionType: string) => {
    if (direction === "right") {
      const elapsed = Date.now() - (startTime || Date.now());
      const points = elapsed < 2000 ? 1.5 : 1;
      setScores((prev: any) => ({
        ...prev,
        [questionType]: prev[questionType] + points,
      }));
    }
    if (currentIndex < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setStartTime(Date.now());
    }
  };

  const getResult = () => {
    const entries = Object.entries(scores) as [string, number][];
    const maxScore = Math.max(...entries.map(([, score]) => score));
    const winners = entries.filter(([, score]) => score === maxScore);
    const [type] = winners[Math.floor(Math.random() * winners.length)];
    return type;
  };

  useEffect(() => {
    if (questions.length > 0) setStartTime(Date.now());
  }, [questions]);

  return {
    questions,
    currentIndex,
    handleSwipe,
    getResult,
    progress:
      questions.length > 0 ? (currentIndex / questions.length) * 100 : 0,
  };
}

// ------------------------------------------------------------------
// [4] 하위 컴포넌트들
// ------------------------------------------------------------------
function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-14 sm:h-16 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-[420px] px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tighter text-white">
            kkokgo
          </h1>
        </div>
      </div>
    </header>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-lime-400 mb-4 sm:mb-6 mx-auto" />
      </motion.div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 text-white leading-tight">
        나에게 딱 맞는
        <br />
        고등학교 학과 찾기
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 font-bold">
        인문계? 특성화고? 내 적성은 어디일까?
        <br />
        (AI 진로 분석) 🔥
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="px-8 sm:px-12 py-4 sm:py-5 bg-lime-400 text-black rounded-full text-lg sm:text-xl font-black shadow-[0_0_20px_rgba(163,230,53,0.6)]"
      >
        시작하기 →
      </motion.button>
    </motion.div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[randomIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="bg-white/10 h-2 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-lime-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <motion.div
        key={loadingMessage}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="text-center text-lime-400 text-xs sm:text-sm font-bold"
      >
        {loadingMessage}
      </motion.div>
    </div>
  );
}

function SwipeCard({
  question,
  onSwipe,
}: {
  question: any;
  onSwipe: (dir: string) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      className="absolute w-full max-w-sm"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 text-center">🤔</div>
        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed text-center">
          {question.text}
        </p>
      </div>
    </motion.div>
  );
}

function ResultView({
  resultType,
  onRestart,
}: {
  resultType: string;
  onRestart: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const result = resultMapping[resultType];
  const [selectedMajors] = useState(() => getRandomMajors(resultType, 2));

  // 유효성 검사 및 저장
  const handlePreOrder = async () => {
    if (!phone || phone.trim().length < 10) {
      alert("올바른 전화번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const majorText = selectedMajors.join(", ");
      const { error } = await supabase.from("pre_orders").insert([
        {
          phone: phone.trim(),
          major: majorText,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setShowSuccessPopup(true);
      setPhone("");
    } catch (error) {
      // 에러 상세 정보를 확인하기 위한 개선된 로깅
      console.error(
        "데이터 저장 오류:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      );
      if (error && typeof error === "object" && "message" in error) {
        console.error("Supabase 에러 메시지:", (error as any).message);
      }
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `나는 ${result.title}!`,
      text: `${result.desc} ${result.title} ${result.emoji}\n나의 숨겨진 재능을 찾아보세요!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      // share cancel etc
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 py-8"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6"
      >
        {result.emoji}
      </motion.div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">
        {result.desc}
      </h2>
      <span className="text-lime-400 text-xs font-bold border border-lime-400/30 rounded-full px-3 py-1 mb-2">
        TYPE {resultType} : {hollandTypes[resultType]}
      </span>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8 text-white">
        {result.title}
      </h1>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 mb-3 sm:mb-4 shadow-2xl">
        <div className="text-center mb-3">
          <p className="text-xs text-lime-400 font-bold mb-1">
            ✨ AI가 분석한 맞춤 추천 학과
          </p>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {selectedMajors.map((major: string, index: number) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="px-3 sm:px-4 py-2 bg-white/10 rounded-full text-lime-400 font-bold text-xs sm:text-sm border border-lime-400/30"
            >
              {major}
            </motion.span>
          ))}
          {[1, 2, 3].map((_, index) => (
            <motion.span
              key={`locked-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 2) * 0.15 }}
              className="relative px-3 sm:px-4 py-2 bg-white/5 rounded-full text-gray-500 font-bold text-xs sm:text-sm border border-white/10"
            >
              <span className="blur-[3px] select-none">🔒 ??? 학과</span>
              <span className="absolute inset-0 flex items-center justify-center text-gray-400">
                🔒
              </span>
            </motion.span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-lime-400 flex-shrink-0" />
          <div className="text-white font-bold text-sm sm:text-base leading-snug">
            <p className="mb-1">
              이 학과에 <span className="text-lime-400">안정권</span>으로 합격할
              수 있을까?
            </p>
            <p className="text-xs sm:text-sm text-gray-300">
              내 성적으로 갈 수 있는{" "}
              <span className="text-lime-400">마이스터고, 특성화고</span> 합격
              리스트 받기 👇
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full pl-9 sm:pl-10 pr-4 py-3 sm:py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 font-bold text-base sm:text-lg focus:outline-none focus:border-lime-400"
            />
          </div>
        </div>

        <button
          onClick={handlePreOrder}
          disabled={isSubmitting}
          className="w-full py-3 sm:py-4 bg-lime-400 text-black rounded-2xl font-black text-base sm:text-lg shadow-[0_0_20px_rgba(163,230,53,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "저장 중..."
            : "[무료] 내 맞춤형 입시 전략 리포트 받기"}
        </button>

        <button
          onClick={handleShare}
          className="w-full mt-3 py-3 sm:py-4 bg-transparent border-2 border-white/30 hover:border-white/50 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          친구에게 내 결과 자랑하기 🔗
        </button>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm sm:text-base z-50"
          >
            ✅ 링크가 복사되었습니다!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-6xl text-center mb-4"
              >
                🎉
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-black text-white text-center mb-2">
                사전 예약 성공!
              </h3>
              <p className="text-gray-300 text-center mb-6 font-bold">
                곧 연락드리겠습니다. 감사합니다! 😊
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-3 sm:py-4 bg-lime-400 text-black rounded-2xl font-black text-base sm:text-lg shadow-[0_0_20px_rgba(163,230,53,0.6)]"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onRestart}
        className="text-gray-400 underline font-bold text-base sm:text-lg hover:text-white transition-colors"
      >
        다시 테스트하기
      </button>
      <div className="text-center text-white/20 text-[10px] mt-6 sm:mt-8">
        © 2026 PADA Labs. All rights reserved.
      </div>
    </motion.div>
  );
}

function AnalyzingView({ onComplete }: { onComplete: () => void }) {
  const [progressValue, setProgressValue] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const analysisTexts = [
    "🧬 홀랜드(Holland) 적성 로직에 따른 응답 분석 중...",
    "🏫 전국 특성화고/마이스터고 데이터 대조 중...",
    "✨ 학과 매칭 완료! 잠시만 기다려주세요...",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / 30;
      });
    }, 100);

    const timer1 = setTimeout(() => setTextIndex(1), 1000);
    const timer2 = setTimeout(() => setTextIndex(2), 2500);
    const timer3 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-8"
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-lime-400/20 flex items-center justify-center border-2 border-lime-400/50">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-lime-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.573.097a9.042 9.042 0 01-3.124 0l-.573-.097c-1.717-.293-2.3-2.379-1.067-3.61L16 15.3M5 14.5l-1.402 1.402c-1.232 1.232-.65 3.318 1.067 3.611l.573.097a9.042 9.042 0 003.124 0l.573-.097c1.717-.293 2.3-2.379 1.067-3.61L8 15.3"
            />
          </svg>
        </div>
      </motion.div>
      <div className="w-full max-w-xs mb-8">
        <div className="bg-white/10 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-lime-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="text-right mt-2 text-lime-400 font-mono text-sm">
          {Math.round(progressValue)}%
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={textIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-lime-400 font-mono text-sm sm:text-base font-bold leading-relaxed"
        >
          {analysisTexts[textIndex]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// [5] 메인 페이지 컴포넌트
// ------------------------------------------------------------------
export default function Home() {
  const [stage, setStage] = useState("start");
  const { questions, currentIndex, handleSwipe, getResult, progress } =
    useTestLogic();
  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length && questions.length > 0;

  useEffect(() => {
    if (isComplete && stage === "test") setStage("analyzing");
  }, [isComplete, stage]);

  const handleAnswer = (answer: string) => {
    if (currentQuestion) handleSwipe(answer, currentQuestion.type);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
      </div>

      <div className="relative z-10 h-full w-full flex justify-center overflow-y-auto">
        <div className="w-full max-w-[420px] h-full flex flex-col">
          <Header />
          <AnimatePresence mode="wait">
            {stage === "start" && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 pt-14 sm:pt-16"
              >
                <StartScreen onStart={() => setStage("test")} />
              </motion.div>
            )}

            {stage === "test" && !isComplete && (
              <motion.div
                key="test"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col pt-14 sm:pt-16"
              >
                <div className="flex-shrink-0 p-4 sm:p-6 pb-2">
                  <div className="text-white text-center mb-2 font-bold text-base sm:text-lg">
                    나의 잠재력 분석 중... {Math.round(progress)}%
                  </div>
                  <ProgressBar progress={progress} />
                </div>
                <div className="flex-1 relative flex items-center justify-center px-4 sm:px-6 min-h-0">
                  <AnimatePresence>
                    {currentQuestion && (
                      <SwipeCard
                        key={currentQuestion.id}
                        question={currentQuestion}
                        onSwipe={handleAnswer}
                      />
                    )}
                  </AnimatePresence>
                </div>
                {/* ▼▼▼ 팩맨 진행바 추가 (질문 카드 하단) ▼▼▼ */}
                <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
                  <PacmanProgress
                    current={currentIndex}
                    total={questions.length}
                  />
                </div>
                {/* ▲▲▲ 여기까지 ▲▲▲ */}
                <div className="flex-shrink-0 flex gap-4 justify-center py-4 sm:py-6 pb-6 sm:pb-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAnswer("left")}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center"
                  >
                    <X
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      strokeWidth={4}
                    />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAnswer("right")}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.6)] flex items-center justify-center"
                  >
                    <Circle
                      className="w-8 h-8 sm:w-10 sm:h-10 text-black"
                      strokeWidth={4}
                    />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {stage === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 pt-14 sm:pt-16"
              >
                <AnalyzingView onComplete={() => setStage("result")} />
              </motion.div>
            )}

            {stage === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 pt-14 sm:pt-16 overflow-y-auto"
              >
                <ResultView
                  resultType={getResult()}
                  onRestart={() => {
                    setStage("start");
                    window.location.reload();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
