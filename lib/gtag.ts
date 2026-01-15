// Google Analytics 4 이벤트 전송 유틸리티

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// gtag 함수가 존재하는지 확인
export const isGAEnabled = (): boolean => {
  return typeof window !== "undefined" && typeof window.gtag === "function";
};

// GA4 Client ID 가져오기 (고유 사용자 식별용)
// dataLayer에서 직접 가져오는 동기 방식
export const getClientId = (): string | null => {
  if (typeof window === "undefined" || !window.dataLayer) {
    return null;
  }

  try {
    // dataLayer에서 client_id 찾기
    for (let i = window.dataLayer.length - 1; i >= 0; i--) {
      const item = window.dataLayer[i];
      if (item && typeof item === "object" && "client_id" in item) {
        return item.client_id as string;
      }
    }

    // dataLayer에 없으면 쿠키에서 직접 가져오기
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === `_ga` && value) {
        // _ga 쿠키 형식: GA1.2.XXXXXXXXX.YYYYYYYYY
        const parts = value.split(".");
        if (parts.length >= 4) {
          return `${parts[2]}.${parts[3]}`;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to get GA4 client_id:", error);
  }

  return null;
};

// GA4 이벤트 전송 함수 (Client ID 자동 포함)
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (!isGAEnabled() || !GA_ID) {
    console.warn("Google Analytics is not enabled or GA_ID is not set");
    return;
  }

  // Client ID 가져오기 (고유 사용자 추적용)
  const clientId = getClientId();
  
  // 이벤트 파라미터에 client_id 포함 (Custom Dimension으로 사용 가능)
  const paramsWithClientId = {
    ...eventParams,
    ...(clientId && { client_id: clientId }),
  };

  window.gtag("event", eventName, paramsWithClientId);
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

