import { Metadata } from "next";
import HomePage from "./components/HomePage";

// 홀랜드 유형별 메타데이터
const HOLLAND_META: Record<string, { title: string; desc: string }> = {
  R: { title: "현실형", desc: "손만 대면 고쳐내는 금손의 소유자!" },
  I: { title: "탐구형", desc: "10시간 걸릴 일을 10분 컷하는 효율맨!" },
  A: { title: "예술형", desc: "숨만 쉬어도 힙한 감각적인 아티스트!" },
  S: { title: "사회형", desc: "어딜 가나 사랑받는 분위기 메이커!" },
  E: { title: "기업형", desc: "떡잎부터 남다른 야망가!" },
  C: { title: "관습형", desc: "실수란 없다, 걸어 다니는 계산기!" },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type.toUpperCase() : null;
  const hollandData = type && HOLLAND_META[type] ? HOLLAND_META[type] : null;

  // 기본 URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kkokgo-landing.vercel.app";
  
  // 동적 OG 이미지 URL
  const ogImageUrl = type 
    ? `${baseUrl}/api/og?type=${type}`
    : `${baseUrl}/api/og`;

  // 타이틀과 설명
  const title = hollandData
    ? `나는 ${hollandData.title}! - 꼭고 적성검사 결과`
    : "꼭고 - 1분만에 내적성에 맞는 특성화고 찾기";
  
  const description = hollandData
    ? `${hollandData.desc} 나도 테스트해보기!`
    : "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: "꼭고",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: hollandData 
            ? `꼭고 적성검사 결과 - ${hollandData.title}`
            : "꼭고 - AI 기반 특성화고 매칭 플랫폼",
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function Page() {
  return <HomePage />;
}
