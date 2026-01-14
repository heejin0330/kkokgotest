"use client";

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao: any;
  }
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  Circle,
  X,
  Sparkles,
  TrendingUp,
  Phone,
  Share2,
  CheckCircle,
  Building2,
  Briefcase,
  GraduationCap,
  Lock,
  Copy,
  Instagram,
  MessageCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import html2canvas from "html2canvas";
import {
  questionBank,
  type HollandType,
  type Question,
} from "./data/questions";
import { trackEvent } from "@/lib/gtag";

// ------------------------------------------------------------------
// [0] TypeScript 타입 정의
// ------------------------------------------------------------------
type ScoreType = Record<HollandType, number>;

interface ResultStats {
  employmentRate: string;
  companies: string;
  salary: string;
}

interface ResultReport {
  recommendSchool: string;
  ncsField: string;
  stats: ResultStats;
  manual: string;
}

interface ResultDataType {
  type: string;
  title: string;
  emoji: string;
  desc: string;
  majors: string[];
  report: ResultReport;
}

type ResultDataMap = Record<HollandType, ResultDataType>;

// 학교 정보 (API 응답 타입)
interface SchoolInfo {
  schoolName: string;
  address: string;
  employmentRate: number | null;
  enrollmentRate: number | null;
  graduates: number | null;
  surveyYear: string | null;
  schoolType: string | null;
}

// [수정] 프리미엄 데이터 구조 확장
interface PremiumContent {
  keywords: string[]; // 핵심 키워드 3개
  strength: string; // 심층 분석 (나의 무기)
  study: string; // 맞춤 공부법
  strategy: string; // 필살기 스펙 전략
}

// [교체] PREMIUM_MESSAGES 전체 내용을 아래 코드로 덮어쓰세요.
const PREMIUM_MESSAGES: Record<HollandType, PremiumContent> = {
  R: {
    keywords: ["#금손_엔지니어", "#현실적_해결사", "#도구_마스터"],
    strength:
      "**실재형(R)**인 당신은 말보다 행동으로 보여주는 사람입니다. 복잡한 이론보다는 눈앞에 보이는 기계나 도구를 다룰 때 엄청난 집중력을 발휘하죠. 남들은 고치기 힘들어하는 물건도 뚝딱 고쳐내는 **타고난 엔지니어의 감각**이 당신의 최대 무기입니다.",
    study:
      "책상에만 앉아있는 공부는 비효율적입니다. **직접 실습하고 체험하는 방식**이 최고! 이론을 배운 뒤에는 반드시 관련 키트를 조립하거나 실험해보세요. 눈으로 보고 손으로 만져야 머리에 남습니다.",
    strategy:
      "마이스터고 진학 후 1학년 때 **기능사 자격증** 2개 이상 취득을 목표로 하세요. 특히 **기계설계/전기** 분야 자격증은 공기업 고졸 공채의 필수 스펙입니다. 프로젝트 실습 사진을 모아 포트폴리오를 만드는 것도 잊지 마세요.",
  },
  I: {
    keywords: ["#논리왕", "#지적_호기심", "#데이터_분석가"],
    strength:
      "**탐구형(I)**인 당신은 '왜?'라는 질문을 던지고 끝까지 답을 찾아내는 끈기가 있습니다. 남들이 놓치는 디테일을 발견하고 논리적으로 분석하는 능력은 **연구원이나 개발자**로서 대체 불가능한 재능입니다.",
    study:
      "무조건 외우는 암기식 공부는 쥐약입니다. **원리와 인과관계**를 이해해야 합니다. 혼자 조용히 깊게 파고들 수 있는 환경을 만들고, '왜 그럴까?'를 스스로 정리해보는 노트 필기법을 추천합니다.",
    strategy:
      "SW/과학 특성화고에서 **알고리즘 동아리**나 **학술 동아리** 활동에 올인하세요. **정보처리기능사**는 기본이고, 교내외 해커톤이나 탐구 대회 수상 경력이 대입과 취업 모두에서 강력한 무기가 됩니다.",
  },
  A: {
    keywords: ["#창의력_대장", "#감성_천재", "#트렌드_리더"],
    strength:
      "**예술형(A)**인 당신은 남들과 똑같은 것을 가장 싫어합니다. 풍부한 상상력과 독창적인 표현력은 AI도 따라올 수 없는 당신만의 경쟁력입니다. 당신의 아이디어는 세상을 더 다채롭게 만드는 힘이 있습니다.",
    study:
      "틀에 박힌 시간표는 숨이 막힐 수 있어요. **자유로운 분위기**에서 시각적인 자료(영상, 그림)를 활용해 공부하세요. 좋아하는 음악을 들으며 공부하거나 마인드맵을 그리며 내용을 구조화하는 것이 효과적입니다.",
    strategy:
      "성적보다 중요한 건 **'나만의 포트폴리오'**입니다. 디자인/콘텐츠 고교 진학 후 **GTQ 1급**, **컴퓨터그래픽스운용기능사**를 따고, SNS나 블로그에 꾸준히 작업물을 업로드하여 '나'라는 브랜드를 만드세요.",
  },
  S: {
    keywords: ["#인간_비타민", "#소통_능력자", "#공감_만렙"],
    strength:
      "**사회형(S)**인 당신은 사람의 마음을 움직이는 힘이 있습니다. 친구의 고민을 잘 들어주고 갈등을 중재하는 능력은, 모든 기업이 탐내는 **최고의 커뮤니케이션 스킬**입니다. 혼자보다 '함께'할 때 더 빛나는 사람입니다.",
    study:
      "혼자 공부하면 외롭고 지루함을 느낍니다. **스터디 그룹**을 만들어 친구들에게 내용을 설명해주며 공부해보세요. 남을 가르칠 때 자신이 가장 많이 배우는 타입입니다.",
    strategy:
      "보건/관광/복지 특성화고에서 **봉사 활동** 시간을 꽉 채우세요. **간호조무사**나 **서비스 경영 자격(SMAT)** 취득은 물론, 학생회나 또래 상담부 활동을 통해 리더십 스토리를 만드는 것이 합격의 지름길입니다.",
  },
  E: {
    keywords: ["#야망가", "#리더십", "#설득의_달인"],
    strength:
      "**진취형(E)**인 당신은 목표가 생기면 무섭게 돌진하는 불도저입니다. 사람들을 설득해 내 편으로 만들고 조직을 이끄는 카리스마가 있죠. 창업가나 CEO가 되어 **세상을 움직일 잠재력**을 가지고 있습니다.",
    study:
      "선의의 경쟁자가 있을 때 불타오릅니다! 친구와 **내기 공부**를 하거나, 구체적인 목표 점수를 벽에 붙여두세요. 발표 수업이나 토론 수업에 적극 참여하면 수행평가 점수를 쓸어담을 수 있습니다.",
    strategy:
      "상업/경영 고교에서 **창업 동아리** 활동을 꼭 하세요. **전산회계/세무** 자격증으로 전문성을 갖추고, 모의 투자 대회나 창업 경진대회에 나가서 '도전하고 성취한 경험'을 자소서에 녹여내야 합니다.",
  },
  C: {
    keywords: ["#인간_계산기", "#계획형_J", "#완벽주의"],
    strength:
      "**관습형(C)**인 당신은 빈틈없는 꼼꼼함의 소유자입니다. 규칙을 잘 지키고 자료를 체계적으로 정리하는 능력은 **금융, 회계, 행정** 분야에서 신뢰받는 최고의 인재상입니다. 실수를 모르는 완벽주의자죠.",
    study:
      "**플래너 활용**이 필수입니다. 시간 단위로 계획을 세우고 하나씩 지워나가는 과정에서 성취감을 느낍니다. 오답 노트를 꼼꼼히 정리하여 같은 실수를 반복하지 않는 것이 고득점 비결입니다.",
    strategy:
      "금융/세무 특성화고 진학 후 **전산세무 2급**, **ERP 정보관리사** 자격증을 단계별로 취득하세요. 성실함이 가장 큰 무기이므로 **3년 개근**과 꼼꼼한 내신 관리가 공공기관/은행권 취업의 열쇠입니다.",
  },
};

// [수정] resetTest 추가하여 타입 에러 해결
interface UseTestLogicReturn {
  questions: Question[];
  currentIndex: number;
  handleSwipe: (direction: string, questionType: HollandType) => void;
  getResult: () => HollandType;
  scores: ScoreType;
  progress: number;
  initTest: (mode: "basic" | "premium") => void;
  resetTest: () => void;
  // 정밀진단 모드용
  answers: (string | null)[];
  handleAnswer: (value: string) => void;
  handlePrevious: () => void;
  handleNext: () => void;
}

// ------------------------------------------------------------------
// 유효한 Holland 타입인지 검증하는 헬퍼 함수
// ------------------------------------------------------------------
const VALID_HOLLAND_TYPES: HollandType[] = ["R", "I", "A", "S", "E", "C"];

function isValidHollandType(value: string | null): value is HollandType {
  return value !== null && VALID_HOLLAND_TYPES.includes(value as HollandType);
}

// 통합 결과 데이터 (RESULT_DATA)
const RESULT_DATA: ResultDataMap = {
  R: {
    type: "실재형",
    title: "마이더스의 손",
    emoji: "🛠️",
    desc: "손만 대면 고쳐내는 금손의 소유자!",
    majors: [
      "🚁 드론공간정보과",
      "🔧 기계설계과",
      "🤖 로봇제어과",
      "⚙️ 정밀기계과",
      "✈️ 항공정비과",
    ],
    report: {
      recommendSchool: "수도전기공업고등학교",
      ncsField: "에너지·기계 직무",
      stats: {
        employmentRate: "97.7%",
        companies: "한국전력, 삼성전자, 현대차",
        salary: "초봉 4,000만원↑ (공기업)",
      },
      manual:
        "이론 공부보다 실습이 훨씬 재밌죠? 마이스터고 가면 내신 5등급도 대기업 기술직으로 골인할 수 있습니다.",
    },
  },
  I: {
    type: "탐구형",
    title: "천재 해커",
    emoji: "💻",
    desc: "10시간 걸릴 일을 10분 컷하는 효율맨!",
    majors: [
      "💻 소프트웨어과",
      "🔋 이차전지과",
      "🛡️ 정보보호과",
      "🧠 인공지능과",
      "💊 바이오제약과",
    ],
    report: {
      recommendSchool: "대덕소프트웨어마이스터고",
      ncsField: "정보통신·SW 직무",
      stats: {
        employmentRate: "92.1%",
        companies: "토스(Toss), 배민, 금융감독원",
        salary: "개발자 초봉 5,000만원↑",
      },
      manual:
        "애매한 대학 컴공과보다 낫습니다. 졸업과 동시에 '네카라쿠배' 개발자로 취업하거나 SKY 대학으로 진학하는 케이스가 많아요.",
    },
  },
  A: {
    type: "예술형",
    title: "트렌드 세터",
    emoji: "🎨",
    desc: "숨만 쉬어도 힙한 감각적인 아티스트!",
    majors: [
      "🎨 웹툰창작과",
      "🎤 K-POP콘텐츠과",
      "🖌️ 시각디자인과",
      "🎮 게임그래픽과",
      "🏠 실내건축과",
    ],
    report: {
      recommendSchool: "한국애니메이션고등학교",
      ncsField: "디자인·문화콘텐츠 직무",
      stats: {
        employmentRate: "진학률 85%↑",
        companies: "네이버웹툰, 한예종/홍익대 진학",
        salary: "업계 탑티어 포트폴리오",
      },
      manual:
        "입시 미술 하느라 돈 쓰는 대신, 학교에서 웹툰 그리고 게임 만들면서 바로 프로 데뷔 준비하세요.",
    },
  },
  S: {
    type: "사회형",
    title: "핵인싸 아이돌",
    emoji: "💖",
    desc: "어딜 가나 사랑받는 분위기 메이커!",
    majors: [
      "🚑 응급구조과",
      "👶 유아교육과",
      "💉 보건간호과",
      "🏛️ 공공행정과",
      "✈️ 관광경영과",
    ],
    report: {
      recommendSchool: "서울관광고등학교",
      ncsField: "보건·복지·서비스 직무",
      stats: {
        employmentRate: "공무원 합격 다수",
        companies: "9급 공무원, 대학병원, 호텔리어",
        salary: "안정적인 공무원 연금",
      },
      manual:
        "남들 공무원 시험 준비할 때, 특성화고 특채로 20살에 9급 공무원 되는 지름길이 있습니다.",
    },
  },
  E: {
    type: "진취형",
    title: "영앤리치 CEO",
    emoji: "👑",
    desc: "떡잎부터 남다른 야망가!",
    majors: [
      "📈 금융경영과",
      "📹 1인크리에이터과",
      "💰 금융회계과",
      "🛍️ 라이브커머스과",
      "📢 마케팅과",
    ],
    report: {
      recommendSchool: "서울여자상업고등학교",
      ncsField: "경영·금융 직무",
      stats: {
        employmentRate: "100% (취업희망자)",
        companies: "한국은행, 금감원, 5대 시중은행",
        salary: "금융권 초봉 5,000만원↑",
      },
      manual:
        "인서울 상경계열 나와도 힘든 '금융권 A매치' 공기업 취업, 여기선 학교 추천으로 갑니다.",
    },
  },
  C: {
    type: "관습형",
    title: "인간 AI",
    emoji: "🤖",
    desc: "실수란 없다, 걸어 다니는 계산기!",
    majors: [
      "📊 금융빅데이터과",
      "🏢 세무행정과",
      "📦 스마트물류과",
      "📂 공공사무행정과",
      "🧾 세무회계과",
    ],
    report: {
      recommendSchool: "선린인터넷고등학교",
      ncsField: "경영지원·사무행정 직무",
      stats: {
        employmentRate: "대입/취업 선택형",
        companies: "공공기관, 대기업 재무팀",
        salary: "안정성 끝판왕 직무",
      },
      manual:
        "숫자에 밝고 정리를 잘하나요? 기업의 안살림을 책임지는 핵심 인재로 모셔갑니다.",
    },
  },
};

// ------------------------------------------------------------------
// 1️⃣ HexagonChart 컴포넌트
// ------------------------------------------------------------------
const HexagonChart = ({ scores }: { scores: ScoreType }) => {
  const values = Object.values(scores) as number[];
  const maxScore = values.length > 0 ? Math.max(...values, 10) : 10;

  const types: HollandType[] = ["R", "I", "A", "S", "E", "C"];

  const getPoint = (value: number, index: number, max: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const radius = (value / max) * 80;
    const x = Math.cos(angle) * radius + 100;
    const y = Math.sin(angle) * radius + 100;
    return `${x},${y}`;
  };

  const points = types
    .map((type, i) => getPoint(scores[type] || 0, i, maxScore))
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="relative w-[200px] h-[200px]">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full transform rotate-0 overflow-visible"
        >
          {[20, 40, 60, 80, 100].map((r, idx) => (
            <polygon
              key={idx}
              points={types.map((_, i) => getPoint(r, i, 100)).join(" ")}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}
          {types.map((_, i) => {
            const p = getPoint(100, i, 100);
            return (
              <line
                key={i}
                x1="100"
                y1="100"
                x2={p.split(",")[0]}
                y2={p.split(",")[1]}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            );
          })}
          <motion.polygon
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            points={points}
            fill="rgba(163, 230, 53, 0.3)"
            stroke="#a3e635"
            strokeWidth="2"
            className="drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]"
          />
          {types.map((type, i) => {
            const [x, y] = getPoint(scores[type] || 0, i, maxScore).split(",");
            return <circle key={i} cx={x} cy={y} r="3" fill="#a3e635" />;
          })}
        </svg>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 text-[11px] text-gray-300 font-bold">
          현실(R)
        </div>
        <div className="absolute top-[25%] right-0 -mr-6 text-[11px] text-gray-300 font-bold">
          탐구(I)
        </div>
        <div className="absolute bottom-[25%] right-0 -mr-6 text-[11px] text-gray-300 font-bold">
          예술(A)
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-6 text-[11px] text-gray-300 font-bold">
          사회(S)
        </div>
        <div className="absolute bottom-[25%] left-0 -ml-6 text-[11px] text-gray-300 font-bold">
          진취(E)
        </div>
        <div className="absolute top-[25%] left-0 -ml-6 text-[11px] text-gray-300 font-bold">
          관습(C)
        </div>
      </div>
    </div>
  );
};

// 팩맨 프로그레스 바
const PacmanProgress = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full max-w-md mx-auto mb-8 px-2">
      <div className="relative h-8 flex items-center justify-between">
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: total }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < current
                  ? "bg-transparent scale-0"
                  : "bg-white/20 scale-100"
              }`}
            />
          ))}
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
          style={{ left: `${progress}%`, marginLeft: "-12px" }}
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse"></div>
            <div
              className="absolute inset-0 bg-yellow-400 rounded-full"
              style={{
                clipPath: "polygon(100% 0%, 100% 100%, 50% 50%, 0% 50%, 0% 0%)",
                transform: "rotate(-45deg)",
              }}
            ></div>
            <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="text-right text-[10px] text-gray-500 mt-1 font-mono">
        STAGE {current} / {total}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 학교 카드 슬라이더 컴포넌트
// ------------------------------------------------------------------
interface SchoolCardData {
  major: string;
  schoolName: string;
  address: string;
  employmentRate: number | null;
  enrollmentRate: number | null;
  schoolType: string | null;
}

const SchoolCardSlider = ({
  cards,
  ncsField,
  expertComment,
}: {
  cards: SchoolCardData[];
  ncsField: string;
  expertComment: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < cards.length) {
      setDirection(newDirection);
      setCurrentIndex(newIndex);
    }
  };

  const currentCard = cards[currentIndex];

  if (!currentCard || cards.length === 0) {
    return (
      <div className="w-full max-w-md bg-white/5 rounded-3xl p-6 text-center">
        <p className="text-gray-400">학교 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-lime-400" />
          <h3 className="text-lg sm:text-xl font-black text-white">
            📋 맞춤 진학 리포트
          </h3>
        </div>
        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* 페이지 인디케이터 */}
      <div className="flex justify-center gap-2 mb-4">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "bg-lime-400 w-6"
                : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* 카드 슬라이더 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-400/10 to-emerald-400/10 backdrop-blur-xl">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="p-5 sm:p-6"
          >
            {/* 학교 정보 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-lime-400" />
                <span className="text-xs text-gray-400">추천 학교</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white mb-1">
                {currentCard.schoolName}
              </h4>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{currentCard.address}</span>
                {currentCard.schoolType && (
                  <span className="ml-2 text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full">
                    {currentCard.schoolType}
                  </span>
                )}
              </div>
            </div>

            {/* 추천 학과 */}
            <div className="bg-white/5 rounded-2xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-lime-400" />
                <span className="text-xs text-gray-400">추천 학과</span>
              </div>
              <p className="text-white font-bold">{currentCard.major}</p>
            </div>

            {/* NCS 직무 분야 */}
            <div className="bg-white/5 rounded-2xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-lime-400" />
                <span className="text-xs text-gray-400">NCS 직무 분야</span>
              </div>
              <p className="text-white font-bold text-sm">{ncsField}</p>
            </div>

            {/* 취업률/진학률 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-300 mb-1">취업률</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {currentCard.employmentRate !== null
                    ? `${currentCard.employmentRate}%`
                    : "-"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-4 text-center">
                <p className="text-xs text-purple-300 mb-1">대학진학률</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {currentCard.enrollmentRate !== null
                    ? `${currentCard.enrollmentRate}%`
                    : "-"}
                </p>
              </div>
            </div>

            {/* 진로 전문가 코멘트 */}
            <div className="p-4 bg-lime-400/10 rounded-2xl mb-3">
              <p className="text-xs text-lime-400 font-bold mb-2">
                💡 진로 전문가 코멘트
              </p>
              <p className="text-white text-sm leading-relaxed">
                {expertComment}
              </p>
            </div>

            {/* 출처 표기 */}
            <p className="text-[10px] text-gray-500 text-center">
              📊 출처: 한국교육개발원 교육통계서비스 (KEDI)
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 좌우 네비게이션 버튼 */}
        {currentIndex > 0 && (
          <button
            onClick={() => paginate(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < cards.length - 1 && (
          <button
            onClick={() => paginate(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// [1] Supabase 클라이언트 설정
// ------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// A/B 테스트 문구 버전 정의
// ------------------------------------------------------------------
const AB_VARIANTS = [
  {
    id: "A",
    title1: "나에게 딱 맞는",
    title2: "고등학교 학과 찾기",
    subtitle1: "인문계? 특성화고? 내 적성은 어디일까?",
    subtitle2: "(AI 진로 분석) 🔥",
  },
  {
    id: "B",
    title1: "3분 만에 밝혀지는",
    title2: "나의 진짜 진로 유형",
    subtitle1: "간단한 테스트로 숨겨진 적성을 발견해보세요",
    subtitle2: "",
  },
];

// A/B 테스트 클릭 기록 함수
async function recordABTestClick(variant: string) {
  try {
    await supabase.from("ab_test_clicks").insert({ variant });
  } catch (error) {
    console.error("A/B test click recording failed:", error);
  }
}

function getRandomMajors(type: HollandType, count = 2): string[] {
  const majors = [...RESULT_DATA[type].majors];
  const selected: string[] = [];
  for (let i = 0; i < count && majors.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * majors.length);
    selected.push(majors.splice(randomIndex, 1)[0]);
  }
  return selected;
}

// 질문 셔플 함수 개선: mode에 따라 문항 수 조절
function generateShuffledQuestions(isPremium: boolean): Question[] {
  const types: HollandType[] = ["R", "I", "A", "S", "E", "C"];
  const selected: Question[] = [];

  // 기본(Basic): 유형별 2개 (총 12개)
  // 프리미엄(Premium): 유형별 전체 (또는 10개)
  const countPerType = isPremium ? 10 : 2;

  types.forEach((type) => {
    const filtered = questionBank.filter((q) => q.type === type);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, countPerType));
  });
  return selected.sort(() => Math.random() - 0.5);
}

// 텍스트 포맷팅 헬퍼 (굵은 글씨)
const formatText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const loadingMessages = [
  "🏫 전국 마이스터고/특성화고 커리큘럼 분석 중...",
  "💼 졸업생 실제 취업 데이터 대조 중...",
  "📊 나의 성향과 학과 적합도 매칭 중...",
];

// ------------------------------------------------------------------
// [3] Hook: 테스트 로직
// ------------------------------------------------------------------
function useTestLogic(): UseTestLogicReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<ScoreType>({
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);

  // 초기화 함수: 모드에 따라 문제 세팅
  const initTest = useCallback((mode: "basic" | "premium") => {
    const isPremium = mode === "premium";
    const newQuestions = generateShuffledQuestions(isPremium);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    setStartTime(Date.now());
    // 정밀진단 모드일 때 answers 배열 초기화
    if (isPremium) {
      setAnswers(new Array(newQuestions.length).fill(null));
    } else {
      setAnswers([]);
    }
  }, []);

  // 최초 로드 시 기본 테스트 시작
  useEffect(() => {
    initTest("basic");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipe = useCallback(
    (direction: string, questionType: HollandType) => {
      if (direction === "right") {
        const elapsed = Date.now() - (startTime || Date.now());
        const points = elapsed < 2000 ? 1.5 : 1;
        setScores((prev) => ({
          ...prev,
          [questionType]: prev[questionType] + points,
        }));
      }
      setCurrentIndex((prev) => prev + 1);
      setStartTime(Date.now());
    },
    [startTime]
  );

  const getResult = useCallback((): HollandType => {
    const entries = Object.entries(scores) as [HollandType, number][];
    const maxScore = Math.max(...entries.map(([, score]) => score));
    const winners = entries.filter(([, score]) => score === maxScore);
    const [type] = winners[Math.floor(Math.random() * winners.length)];
    return type;
  }, [scores]);

  const progress = useMemo(
    () => (questions.length > 0 ? (currentIndex / questions.length) * 100 : 0),
    [currentIndex, questions.length]
  );

  // 정밀진단 모드용 답변 저장 함수 (자동으로 다음 문제로 이동)
  const handleAnswer = useCallback(
    (value: string) => {
      const currentQuestion = questions[currentIndex];
      if (!currentQuestion) return;

      // 답변 저장
      setAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[currentIndex] = value;
        return newAnswers;
      });

      // 점수 계산 (right = 좋아요, left = 싫어요)
      if (value === "right") {
        setScores((prev) => ({
          ...prev,
          [currentQuestion.type]: prev[currentQuestion.type] + 1,
        }));
      }

      // 자동으로 다음 문제로 이동
      if (currentIndex >= questions.length - 1) {
        // 마지막 문제면 테스트 완료를 위해 인덱스를 증가시켜 isTestComplete를 true로 만듦
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 다음 문제로 이동
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, questions]
  );

  // 이전 문제로 이동
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // 다음 문제로 이동 (점수 계산 포함)
  const handleNext = useCallback(() => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];

    if (!currentQuestion || !currentAnswer) {
      return; // 답변이 선택되지 않았으면 이동하지 않음
    }

    // 점수 계산 (right = 좋아요, left = 싫어요)
    if (currentAnswer === "right") {
      setScores((prev) => ({
        ...prev,
        [currentQuestion.type]: prev[currentQuestion.type] + 1,
      }));
    }

    // 마지막 문제면 테스트 완료를 위해 인덱스를 증가시켜 isTestComplete를 true로 만듦
    if (currentIndex >= questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 다음 문제로 이동
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions, answers]);

  return {
    questions,
    currentIndex,
    handleSwipe,
    getResult,
    scores,
    progress,
    resetTest: () => initTest("basic"),
    initTest,
    answers,
    handleAnswer,
    handlePrevious,
    handleNext,
  };
}

// ------------------------------------------------------------------
// [4] 하위 컴포넌트들
// ------------------------------------------------------------------
function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-14 sm:h-16 z-50 backdrop-blur-xl bg-slate-950/80">
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
  const [variant, setVariant] = useState<(typeof AB_VARIANTS)[0] | null>(null);

  // 접속 시 랜덤 버전 선택 (localStorage로 동일 사용자 버전 유지)
  useEffect(() => {
    const storedVariantId = localStorage.getItem("ab_variant");
    if (storedVariantId) {
      const found = AB_VARIANTS.find((v) => v.id === storedVariantId);
      if (found) {
        setVariant(found);
        return;
      }
    }
    // 저장된 버전이 없으면 랜덤 선택
    const randomIndex = Math.floor(Math.random() * AB_VARIANTS.length);
    const selectedVariant = AB_VARIANTS[randomIndex];
    localStorage.setItem("ab_variant", selectedVariant.id);
    setVariant(selectedVariant);
  }, []);

  const handleStart = () => {
    trackEvent("click_event_start");
    // A/B 테스트 클릭 기록
    if (variant) {
      recordABTestClick(variant.id);
    }
    onStart();
  };

  // 버전 로딩 중에는 빈 화면 표시
  if (!variant) {
    return null;
  }

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
        {variant.title1}
        <br />
        {variant.title2}
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 font-bold">
        {variant.subtitle1}
        {variant.subtitle2 && (
          <>
            <br />
            {variant.subtitle2}
          </>
        )}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
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
  question: Question;
  onSwipe: (dir: string) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
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
      role="region"
      aria-label={`질문: ${question.text}`}
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 text-center">🤔</div>
        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed text-center">
          {question.text}
        </p>
      </div>
    </motion.div>
  );
}

// 정밀진단 모드용 라디오 버튼 기반 질문 카드
function PremiumQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: Question;
  selectedAnswer: string | null;
  onAnswer: (value: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 text-center">🤔</div>
        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed text-center mb-8">
          {question.text}
        </p>

        {/* 라디오 버튼 선택지 */}
        <div className="flex gap-4 justify-center">
          <label
            className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 cursor-pointer transition-all ${
              selectedAnswer === "right"
                ? "bg-lime-400 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.6)]"
                : "bg-white/5 border-white/20 hover:border-white/40"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value="right"
              checked={selectedAnswer === "right"}
              onChange={() => onAnswer("right")}
              className="sr-only"
            />
            <Circle
              className={`w-8 h-8 sm:w-10 sm:h-10 ${
                selectedAnswer === "right" ? "text-black" : "text-lime-400"
              }`}
              fill={selectedAnswer === "right" ? "currentColor" : "none"}
              strokeWidth={4}
            />
          </label>

          <label
            className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 cursor-pointer transition-all ${
              selectedAnswer === "left"
                ? "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                : "bg-white/5 border-white/20 hover:border-white/40"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value="left"
              checked={selectedAnswer === "left"}
              onChange={() => onAnswer("left")}
              className="sr-only"
            />
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={4} />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// Comparison Section Component
function ComparisonSection({
  currentResultType,
  isPremiumMode,
}: {
  currentResultType: HollandType;
  isPremiumMode: boolean;
}) {
  const [simpleResult, setSimpleResult] = useState<HollandType | null>(null);

  useEffect(() => {
    // Only show comparison if this is a premium (detailed) diagnosis
    if (isPremiumMode && typeof window !== "undefined") {
      const savedResult = localStorage.getItem("simpleTestResult");
      if (isValidHollandType(savedResult)) {
        setSimpleResult(savedResult);
      }
    }
  }, [isPremiumMode]);

  // Don't render if not premium mode or no simple result exists
  if (!isPremiumMode || !simpleResult) {
    return null;
  }

  const isSameResult = simpleResult === currentResultType;
  const simpleData = RESULT_DATA[simpleResult];
  const detailedData = RESULT_DATA[currentResultType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mt-8"
    >
      <div className="text-center mb-4">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
          🔎 진단 결과 비교
        </h3>
        <p className="text-sm text-gray-400">간단 진단 vs 정밀 진단 비교</p>
      </div>

      {/* Badge */}
      <div className="flex justify-center mb-4">
        {isSameResult ? (
          <div className="px-4 py-2 bg-green-500/20 border-2 border-green-500 rounded-full">
            <span className="text-green-400 font-bold text-sm">
              적성이 아주 확실하시네요! 🎯
            </span>
          </div>
        ) : (
          <div className="px-4 py-2 bg-yellow-500/20 border-2 border-yellow-500 rounded-full">
            <span className="text-yellow-400 font-bold text-sm">
              새로운 가능성을 발견했어요! 💡
            </span>
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Side - Simple Diagnosis */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="text-center mb-3">
            <div className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full mb-2">
              <span className="text-blue-400 text-xs font-bold">
                간단 진단 (12문항)
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">{simpleData.emoji}</div>
            <div className="text-xs text-gray-400 mb-1">{simpleData.type}</div>
            <div className="text-lg font-bold text-white">
              {simpleData.title}
            </div>
            <div className="text-xs text-gray-300 mt-2">{simpleData.desc}</div>
          </div>
        </div>

        {/* Right Side - Detailed Diagnosis */}
        <div className="flex-1 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl border-2 border-indigo-500/50 rounded-2xl p-4 shadow-lg shadow-indigo-500/20">
          <div className="text-center mb-3">
            <div className="inline-block px-3 py-1 bg-indigo-500/30 border border-indigo-500/50 rounded-full mb-2">
              <span className="text-indigo-300 text-xs font-bold">
                정밀 진단 (60문항)
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">{detailedData.emoji}</div>
            <div className="text-xs text-gray-300 mb-1">
              {detailedData.type}
            </div>
            <div className="text-lg font-bold text-white">
              {detailedData.title}
            </div>
            <div className="text-xs text-gray-200 mt-2">
              {detailedData.desc}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {!isSameResult && (
        <div className="mt-4 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <p className="text-xs text-yellow-200 text-center leading-relaxed">
            💡 정밀 진단은 더 많은 질문을 통해 심층 분석한 결과입니다.
            <br />
            새로운 적성을 발견하셨네요!
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ResultView({
  resultType,
  scores,
  isPremiumMode,
  initialUnlocked = false,
  onStartPremiumTest,
  onRestart,
}: {
  resultType: HollandType;
  scores: ScoreType | null;
  isPremiumMode: boolean;
  initialUnlocked?: boolean;
  onStartPremiumTest: () => void;
  onRestart: () => void;
}) {
  const data = RESULT_DATA[resultType];
  const [selectedMajors] = useState(() => getRandomMajors(resultType, 2));
  const [phone, setPhone] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<
    Record<string, SchoolInfo[]>
  >({});
  const [userRegion, setUserRegion] = useState<string>("");

  // IP 기반 지역 파악 및 학교 정보 로딩
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        // 1. IP 기반 지역 파악 (지역 정보는 참고용으로만 사용)
        const regionRes = await fetch("/api/schools", { method: "POST" });
        const regionData = await regionRes.json();
        const region = regionData.region || "Seoul";
        setUserRegion(region);

        // 2. 학과별 학교 검색 (취업률/진학률 기준 정렬된 결과)
        const majors = data?.majors || [];
        const schoolRes = await fetch(
          `/api/schools?majors=${encodeURIComponent(
            majors.join(",")
          )}&region=${encodeURIComponent(region)}`
        );
        const schoolData = await schoolRes.json();

        if (schoolData.success) {
          setSchoolInfo(schoolData.data);
        }
      } catch (error) {
        console.error("Failed to load school info:", error);
      }
    };

    if (data) {
      loadSchoolInfo();
    }
  }, [data]);

  // 카드 슬라이더용 데이터 생성 (각 학과별 상위 학교 선택)
  const schoolCards: SchoolCardData[] = useMemo(() => {
    if (!data) return [];
    return data.majors.map((major) => {
      const schools = schoolInfo[major] || [];
      // 각 학과별 첫 번째 학교(가장 높은 점수) 선택
      const topSchool = schools[0];
      
      // 학교 정보가 없어도 카드 표시 (기본값)
      if (!topSchool) {
        return {
          major: major,
          schoolName: "정보 확인 중...",
          address: "",
          employmentRate: null,
          enrollmentRate: null,
          schoolType: null,
        };
      }
      
      return {
        major: major,
        schoolName: topSchool.schoolName || "정보 로딩 중...",
        address: topSchool.address || "",
        employmentRate: topSchool.employmentRate ?? null,
        enrollmentRate: topSchool.enrollmentRate ?? null,
        schoolType: topSchool.schoolType ?? null,
      };
    });
  }, [data, schoolInfo]);

  if (!data) return null;

  const handleUnlock = async () => {
    if (!privacyConsent) {
      alert("개인정보 활용동의를 해주세요.");
      return;
    }
    const phoneRegex = /^01[0-9]\d{7,8}$/;
    const cleanPhone = phone.replace(/-/g, "");
    if (!phone || !phoneRegex.test(cleanPhone)) {
      alert("올바른 휴대폰 번호 형식이 아닙니다.");
      return;
    }

    // GA4 이벤트 전송
    trackEvent("click_free_major", {
      result_type: resultType,
    });

    setIsSubmitting(true);
    try {
      const majorText = selectedMajors.join(", ");
      const { error } = await supabase.from("pre_orders").insert([
        {
          phone: cleanPhone,
          major: majorText,
          result_type: resultType,
          marketing_consent: marketingConsent,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      const smsResponse = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          resultType: resultType,
          resultTitle: data.title,
        }),
      });

      if (!smsResponse.ok) {
        console.error("SMS 발송 실패:", await smsResponse.text());
        alert("데이터는 저장되었으나 문자 발송에 일시적인 문제가 있습니다.");
      }
      setIsUnlocked(true);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(
        "사전 예약 저장 오류:",
        error instanceof Error ? error.message : String(error)
      );
      let msg = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      if (typeof error === "object" && error !== null && "code" in error) {
        if ((error as any).code === "23505") {
          msg = "이미 등록된 전화번호입니다.";
        }
      }
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareUrl = () => {
    let shareUrl = window.location.href;
    if (!shareUrl.includes("type=")) {
      shareUrl = `${window.location.origin}${window.location.pathname}?type=${resultType}`;
    }
    return shareUrl;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: `나는 ${data.title}!`,
      text: `${data.desc} ${data.title} ${data.emoji}\n나의 숨겨진 재능을 찾아보세요!`,
      url: shareUrl,
    };

    // 모바일이거나 navigator.share가 지원되는 경우
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // 사용자가 공유를 취소한 경우는 무시
        if ((err as Error).name !== "AbortError") {
          console.error("공유 실패:", err);
        }
      }
    } else {
      // PC 또는 navigator.share가 지원되지 않는 경우 공유 모달 표시
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowShareModal(false);
    } catch (err) {
      console.error("링크 복사 실패:", err);
      alert("링크 복사에 실패했습니다.");
    }
  };

  const handleKakaoShare = () => {
    // 카카오 SDK가 로드되었는지 확인
    if (typeof window === "undefined" || !window.Kakao) {
      alert(
        "카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    // 카카오 SDK 초기화 확인 및 초기화
    if (!window.Kakao.isInitialized()) {
      const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
      if (!kakaoApiKey) {
        alert("카카오 API 키가 설정되지 않았습니다.");
        return;
      }
      window.Kakao.init(kakaoApiKey);
    }

    const shareUrl = getShareUrl();
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : shareUrl;
    const imageUrl = `${window.location.origin}/og-image-2.png`;

    try {
      // 카카오톡 피드 메시지 전송
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: "꼭고 - 특성화고/마이스터고 매칭 플랫폼",
          description: "AI 진로 테스트로 나에게 딱 맞는 고등학교를 찾아보세요!",
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
          },
        },
        buttons: [
          {
            title: "테스트 시작하기",
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
        ],
      });
    } catch (err) {
      console.error("카카오톡 공유 실패:", err);
      alert("카카오톡 공유에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleSaveImage = async () => {
    try {
      // 결과 영역을 찾아서 캡처
      const resultElement = document.querySelector(
        "[data-result-content]"
      ) as HTMLElement;
      if (!resultElement) {
        alert("결과 영역을 찾을 수 없습니다.");
        return;
      }

      const canvas = await html2canvas(resultElement, {
        backgroundColor: "#020617", // slate-950 배경색
        scale: 2, // 고해상도
        useCORS: true,
      });

      // 이미지 다운로드
      const link = document.createElement("a");
      link.download = `kkokgo_${data.title}_${resultType}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowShareModal(false);
    } catch (err) {
      console.error("이미지 저장 실패:", err);
      alert("이미지 저장에 실패했습니다.");
    }
  };

  const handleInstagramInfo = () => {
    alert(
      "💡 인스타그램 공유 방법\n\n1. 위의 '이미지 저장' 버튼을 눌러 결과 이미지를 저장하세요.\n2. 인스타그램 앱을 열고 스토리 또는 게시물을 만드세요.\n3. 저장한 이미지를 선택하여 업로드하세요!\n\n✨ 멋진 결과를 친구들과 공유해보세요!"
    );
  };

  const handlePremiumClick = () => {
    // 무료 리포트 오픈 상태에서는 바로 진행
    if (isUnlocked || isPremiumMode) {
      const confirmMsg =
        "🎉 [베타 서비스 혜택]\n\n지금은 정밀 진단(60문항) 기능 오픈 기념으로\n1000원 결제 없이 무료로 진행됩니다!\n\n바로 60문항 검사를 시작하시겠습니까?";
      if (confirm(confirmMsg)) {
        trackEvent("click_beta_start");
        onStartPremiumTest();
      }
      return;
    }

    // 무료 리포트 오픈 전: 개인정보 수집 동의 요청
    alert("개인정보 수집 및 이용에 동의해주세요.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 py-8"
      data-result-content
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6"
      >
        {data.emoji}
      </motion.div>

      <span className="text-lime-400 text-xs font-bold border border-lime-400/30 rounded-full px-3 py-1 mb-2">
        TYPE {resultType} : {data.type}
      </span>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">
        {data.desc}
      </h2>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8 text-white">
        {data.title}
      </h1>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-5 mb-3 sm:mb-4 shadow-2xl">
        <div className="text-center mb-3">
          <p className="text-xs text-lime-400 font-bold mb-1">
            {isUnlocked
              ? "🎉 맞춤 추천 학과 전체 공개!"
              : "✨ AI가 분석한 맞춤 추천 학과"}
          </p>
          {userRegion && (
            <p className="text-[10px] text-gray-400">
              📍 {userRegion} 기준 추천
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {isUnlocked ? (
            data.majors.map((major: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-2xl"
              >
                <span className="text-lime-400 font-bold text-sm">{major}</span>
                {schoolInfo[major] && schoolInfo[major][0] && (
                  <span className="text-gray-300 text-xs">
                    {schoolInfo[major][0].schoolName}
                  </span>
                )}
              </motion.div>
            ))
          ) : (
            <>
              {selectedMajors.map((major: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-2xl"
                >
                  <span className="text-lime-400 font-bold text-sm">
                    {major}
                  </span>
                  {schoolInfo[major] && schoolInfo[major][0] && (
                    <span className="text-gray-300 text-xs">
                      {schoolInfo[major][0].schoolName}
                    </span>
                  )}
                </motion.div>
              ))}
              {[1, 2, 3].map((_, index) => (
                <motion.div
                  key={`locked-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 2) * 0.15 }}
                  className="relative flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl"
                >
                  <span className="blur-[3px] select-none text-gray-500 font-bold text-sm">
                    🔒 ??? 학과
                  </span>
                  <span className="blur-[3px] select-none text-gray-600 text-xs">
                    ??? 고등학교
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 맞춤 진학 리포트 - 카드 슬라이더 */}
      <div className="relative w-full max-w-md mb-4 sm:mb-6">
        {/* 잠금 해제 시: 카드 슬라이더 표시 */}
        {isUnlocked || isPremiumMode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SchoolCardSlider
              cards={schoolCards}
              ncsField={data.report.ncsField}
              expertComment={data.report.manual}
            />
            {/* 공유 버튼 */}
            <button
              onClick={handleShare}
              className="w-full mt-4 py-3 sm:py-4 bg-lime-400 text-black rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.4)]"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              친구에게 내 결과 공유하기 🔗
            </button>
          </motion.div>
        ) : (
          /* 잠금 상태: 블러된 리포트 표시 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-lime-400/10 to-emerald-400/10 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl blur-[6px] pointer-events-none select-none"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-lime-400" />
              <h3 className="text-lg sm:text-xl font-black text-white">
                📋 맞춤 진학 리포트
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl">
                <GraduationCap className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">추천 학교</p>
                  <p className="text-white font-bold text-sm sm:text-base">
                    {data.report.recommendSchool}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl">
                <Briefcase className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">NCS 직무 분야</p>
                  <p className="text-white font-bold text-sm sm:text-base">
                    {data.report.ncsField}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl">
                <Building2 className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">취업 현황</p>
                  <p className="text-white font-bold text-sm sm:text-base">
                    취업률 {data.report.stats.employmentRate}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 잠금 해제 오버레이 - 블러된 리포트 위에 표시 */}
        {!isUnlocked && !isPremiumMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full bg-black/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 mx-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-lime-400" />
                <h3 className="text-white font-black text-lg sm:text-xl">
                  무료 리포트 잠금 해제
                </h3>
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
              <div className="mt-4 mb-4 px-1 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center h-5">
                      <input
                        id="privacy-consent"
                        type="checkbox"
                        checked={privacyConsent}
                        onChange={(e) => setPrivacyConsent(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-lime-400 focus:ring-lime-400 bg-white/10"
                      />
                    </div>
                    <label
                      htmlFor="privacy-consent"
                      className="text-sm font-medium text-white cursor-pointer select-none"
                    >
                      [필수] 개인정보 수집 및 이용 동의
                    </label>
                  </div>
                  <details className="ml-6 text-[11px] text-gray-400 cursor-pointer">
                    <summary className="hover:text-gray-300 underline underline-offset-2">
                      약관 전체 보기 🔽
                    </summary>
                    <div className="p-3 mt-2 bg-black/40 rounded-xl border border-white/10 h-32 overflow-y-auto">
                      <p className="font-bold text-gray-300 mb-1">
                        [개인정보 수집 및 이용 동의]
                      </p>
                      1. 목적: 진로 분석 결과 발송 및 상담, 지역 맞춤 학교 추천
                      <br />
                      2. 항목: 휴대전화번호, 검사 결과 데이터, IP 기반 위치
                      정보(시/도)
                      <br />
                      3. 기간:{" "}
                      <strong>서비스 종료 또는 동의 철회 시까지</strong>
                      <br />
                      4. 권리: 동의를 거부할 수 있으나, 거부 시 결과 발송이
                      불가합니다.
                    </div>
                  </details>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center h-5">
                    <input
                      id="marketing-consent"
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-lime-400 focus:ring-lime-400 bg-white/10"
                    />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <label
                      htmlFor="marketing-consent"
                      className="font-medium text-gray-300 select-none cursor-pointer"
                    >
                      [선택] 정식 서비스 출시 알림 받기
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUnlock}
                disabled={isSubmitting}
                className="w-full py-3 sm:py-4 bg-lime-400 text-black rounded-2xl font-black text-base sm:text-lg shadow-[0_0_20px_rgba(163,230,53,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "저장 중..." : "지금 바로 해제하기 →"}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 2️⃣ 정밀 리포트 (Fake Door -> Real Test Entry) 영역 */}
      {!isPremiumMode && (
        <div className="w-full max-w-md mt-6">
          <button
            onClick={handlePremiumClick}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 skew-x-12 -ml-20 w-20"></div>
            <span className="text-white font-black text-lg flex items-center justify-center gap-2 relative z-10">
              🔒 정밀 적성진단 (60문항)
              <span className="flex items-center gap-1">
                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full line-through decoration-red-500 decoration-2">
                  1000원
                </span>
                <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                  beta
                </span>
              </span>
            </span>
            <p className="text-indigo-200 text-xs mt-1 relative z-10">
              나의 6각형 능력치 그래프 + 상세 합격 전략 포함
            </p>
          </button>
        </div>
      )}

      {/* 프리미엄 리포트 화면 (확장된 UI) */}
      {isPremiumMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mt-6 bg-slate-900/90 border border-indigo-500/50 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-xl font-black text-white italic">
              Premium Report
            </h3>
            <span className="text-[10px] font-bold text-indigo-300 border border-indigo-500/50 bg-indigo-500/10 rounded-full px-3 py-1">
              정밀 진단 완료
            </span>
          </div>

          {/* 1. 육각형 그래프 */}
          <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/5">
            <HexagonChart
              scores={scores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }}
            />
          </div>

          {/* 2. 핵심 키워드 태그 */}
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {PREMIUM_MESSAGES[resultType].keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg"
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="space-y-4 relative z-10">
            {/* 3. 나의 숨겨진 무기 (Strength) */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🗡️</span>
                <h4 className="text-indigo-300 font-bold text-sm">
                  나의 숨겨진 무기
                </h4>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed text-justify">
                {formatText(PREMIUM_MESSAGES[resultType].strength)}
              </p>
            </div>

            {/* 4. 맞춤 공부법 (Study) */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h4 className="text-indigo-300 font-bold text-sm">
                  성향 맞춤 공부법
                </h4>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed text-justify">
                {formatText(PREMIUM_MESSAGES[resultType].study)}
              </p>
            </div>

            {/* 5. 필살기 스펙 전략 (Strategy) */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-2xl border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏆</span>
                <h4 className="text-indigo-300 font-bold text-sm">
                  고교 3년 필살기 전략
                </h4>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed text-justify">
                {formatText(PREMIUM_MESSAGES[resultType].strategy)}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-500">
              * 이 리포트는 AI 빅데이터 분석을 기반으로 생성되었습니다.
            </p>
          </div>
        </motion.div>
      )}

      {/* 모달들 (Toast, Popup 등 기존 코드 유지) */}
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
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessPopup(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="bg-gradient-to-br from-lime-400/20 to-emerald-400/20 backdrop-blur-xl border border-lime-400/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 bg-lime-400/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-12 h-12 text-lime-400" />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  🔓 잠금 해제 성공!
                </h3>
                <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                  AI가 분석한 맞춤 추천 학과가 모두 공개되었습니다.
                  <br />
                  <span className="text-lime-400 font-bold">
                    문자 메시지로도 결과를 받아보세요!
                  </span>
                </p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black text-base sm:text-lg shadow-[0_0_20px_rgba(163,230,53,0.6)] hover:scale-105 transition-transform"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  결과 공유하기
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* 공유 버튼 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 링크 복사 */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-105 group"
                >
                  <div className="w-12 h-12 rounded-full bg-lime-400/20 flex items-center justify-center group-hover:bg-lime-400/30 transition-colors">
                    <Copy className="w-6 h-6 text-lime-400" />
                  </div>
                  <span className="text-white font-bold text-sm">
                    링크 복사
                  </span>
                </button>

                {/* 카카오톡 */}
                <button
                  onClick={handleKakaoShare}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-105 group"
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center group-hover:bg-yellow-400/30 transition-colors">
                    <MessageCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <span className="text-white font-bold text-sm">카카오톡</span>
                </button>

                {/* 이미지 저장 */}
                <button
                  onClick={handleSaveImage}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-105 group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center group-hover:bg-purple-400/30 transition-colors">
                    <ImageIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-white font-bold text-sm">
                    이미지 저장
                  </span>
                </button>

                {/* 인스타그램 */}
                <button
                  onClick={handleInstagramInfo}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-105 group"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-400/20 flex items-center justify-center group-hover:bg-pink-400/30 transition-colors">
                    <Instagram className="w-6 h-6 text-pink-400" />
                  </div>
                  <span className="text-white font-bold text-sm">
                    인스타그램
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Section - Only shows in premium mode if simple result exists */}
      <ComparisonSection
        currentResultType={resultType}
        isPremiumMode={isPremiumMode}
      />

      <button
        onClick={onRestart}
        className="mt-8 text-gray-400 underline font-bold text-base sm:text-lg hover:text-white transition-colors"
      >
        다시 테스트하기
      </button>
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
      setProgressValue((prev) => (prev >= 100 ? 100 : prev + 100 / 30));
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
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-lime-400" />
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
  const [stage, setStage] = useState<"start" | "test" | "analyzing" | "result">(
    "start"
  );
  const {
    questions,
    currentIndex,
    handleSwipe,
    getResult,
    scores,
    progress,
    initTest,
    answers,
    handleAnswer,
    handlePrevious,
    handleNext,
  } = useTestLogic();
  const [finalResultType, setFinalResultType] = useState<HollandType | null>(
    null
  );
  const [isSharedLink, setIsSharedLink] = useState(false);

  const [isPremiumMode, setIsPremiumMode] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isTestComplete =
    currentIndex >= questions.length && questions.length > 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get("type");
      if (isValidHollandType(typeParam)) {
        setFinalResultType(typeParam);
        setIsSharedLink(true);
        setStage("result");
      }
    }
  }, []);

  useEffect(() => {
    if (isTestComplete && stage === "test") {
      const calculatedType = getResult();
      setFinalResultType(calculatedType);
      setIsSharedLink(false);

      // Save simple diagnosis result to localStorage
      if (!isPremiumMode && typeof window !== "undefined") {
        localStorage.setItem("simpleTestResult", calculatedType);
        localStorage.setItem("simpleTestDate", new Date().toISOString());
      }

      setStage("analyzing");
    }
  }, [isTestComplete, stage, getResult, isPremiumMode]);

  const handleAnalysisComplete = useCallback(() => {
    setStage("result");
    if (typeof window !== "undefined" && finalResultType) {
      const newUrl = `${window.location.pathname}?type=${finalResultType}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [finalResultType]);

  const handleSwipeAnswer = useCallback(
    (answer: string) => {
      if (currentQuestion) handleSwipe(answer, currentQuestion.type);
    },
    [currentQuestion, handleSwipe]
  );

  const handleRestart = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    setFinalResultType(null);
    setIsSharedLink(false);
    setIsPremiumMode(false);
    initTest("basic");
    setStage("start");
  }, [initTest]);

  const handleStartPremiumTest = useCallback(() => {
    setIsPremiumMode(true);
    initTest("premium");
    setStage("test");
  }, [initTest]);

  const resultScores = isSharedLink ? null : scores;

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
            {stage === "test" && !isTestComplete && (
              <motion.div
                key="test"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col pt-14 sm:pt-16"
              >
                <div className="flex-shrink-0 p-4 sm:p-6 pb-2">
                  <div className="text-white text-center mb-2 font-bold text-base sm:text-lg">
                    {isPremiumMode
                      ? "정밀 진단 진행 중..."
                      : "나의 커리어 코드 분석 중..."}{" "}
                    {Math.round(progress)}%
                  </div>
                  <ProgressBar progress={progress} />
                </div>
                <div className="flex-1 relative flex items-center justify-center px-4 sm:px-6 min-h-0">
                  <AnimatePresence mode="wait">
                    {currentQuestion &&
                      (isPremiumMode ? (
                        <PremiumQuestionCard
                          key={currentQuestion.id}
                          question={currentQuestion}
                          selectedAnswer={answers[currentIndex] || null}
                          onAnswer={handleAnswer}
                        />
                      ) : (
                        <SwipeCard
                          key={currentQuestion.id}
                          question={currentQuestion}
                          onSwipe={handleSwipeAnswer}
                        />
                      ))}
                  </AnimatePresence>
                </div>
                <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
                  <PacmanProgress
                    current={currentIndex}
                    total={questions.length}
                  />
                </div>
                {isPremiumMode ? (
                  // 정밀진단 모드: 이전 버튼만 (O/X 선택 시 자동으로 다음으로 이동)
                  <div className="flex-shrink-0 flex gap-4 justify-center px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-8">
                    {currentIndex > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrevious}
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-600 hover:bg-gray-500 text-white rounded-full text-base sm:text-lg font-bold shadow-lg transition-colors"
                      >
                        이전
                      </motion.button>
                    )}
                  </div>
                ) : (
                  // 기본 모드: 스와이프 버튼
                  <div className="flex-shrink-0 flex gap-4 justify-center py-4 sm:py-6 pb-6 sm:pb-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSwipeAnswer("left")}
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
                      onClick={() => handleSwipeAnswer("right")}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.6)] flex items-center justify-center"
                    >
                      <Circle
                        className="w-8 h-8 sm:w-10 sm:h-10 text-black"
                        strokeWidth={4}
                      />
                    </motion.button>
                  </div>
                )}
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
                <AnalyzingView onComplete={handleAnalysisComplete} />
              </motion.div>
            )}
            {stage === "result" && finalResultType && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 pt-14 sm:pt-16 overflow-y-auto"
              >
                <ResultView
                  resultType={finalResultType}
                  scores={resultScores}
                  isPremiumMode={isPremiumMode}
                  initialUnlocked={isSharedLink}
                  onStartPremiumTest={handleStartPremiumTest}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* 푸터 - 전체 페이지에 표시 */}
          <div className="flex-shrink-0 text-center text-white/20 text-[10px] py-4">
            © 2026 PADA Labs. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
