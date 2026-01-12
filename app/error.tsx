"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (선택사항)
    console.error("애플리케이션 에러:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-300 mb-6 font-bold">
          예상치 못한 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4 font-mono">
            에러 코드: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="w-full py-3 sm:py-4 bg-lime-400 text-black rounded-2xl font-black text-base sm:text-lg shadow-[0_0_20px_rgba(163,230,53,0.6)]"
          aria-label="다시 시도하기"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
