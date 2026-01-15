// Google Analytics 4 이벤트 전송 유틸리티

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// gtag 함수가 존재하는지 확인
export const isGAEnabled = (): boolean => {
  return typeof window !== "undefined" && typeof window.gtag === "function";
};

// GA4 이벤트 전송 함수
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (!isGAEnabled() || !GA_ID) {
    console.warn("Google Analytics is not enabled or GA_ID is not set");
    return;
  }

  window.gtag("event", eventName, eventParams);
};

// 페이지뷰 추적
export const trackPageView = (pageName: string, additionalParams?: Record<string, any>): void => {
  if (!isGAEnabled() || !GA_ID) {
    return;
  }

  const url = typeof window !== "undefined" ? window.location.pathname + window.location.search : pageName;
  
  window.gtag("config", GA_ID, {
    page_path: url,
    page_title: pageName,
    ...additionalParams,
  });

  // 페이지뷰 이벤트도 별도로 전송
  trackEvent("page_view", {
    page_name: pageName,
    page_path: url,
    ...additionalParams,
  });
};

// 타입 정의 (전역 window 객체에 gtag 추가)
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date | Record<string, any>,
      config?: Record<string, any>
    ) => void;
  }
}

